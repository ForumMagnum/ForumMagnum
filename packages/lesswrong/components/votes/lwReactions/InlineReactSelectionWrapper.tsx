import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { ContentItemBodyImperative } from '../../contents/contentBodyUtil';
import type { VotingProps } from '../votingProps';
import AddInlineReactionButton from "./AddInlineReactionButton";
import LWPopper from "../../common/LWPopper";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { useIsAboveBreakpoint } from '@/components/hooks/useScreenWidth';
import MobilePostSelectionToolbar from './MobilePostSelectionToolbar';

const styles = defineStyles('InlineReactSelectionWrapper', (theme: ThemeType) => ({
  popper: {
    height: 0,
  },
  button: {
    zIndex: 1000,
    position: "relative",
    left: 12,
  },
}));

type Styling = "comment"|"post"|"tag"|"messageRight"|"messageLeft";

function getButtonOffsetLeft(styling: Styling, contentRef?: React.RefObject<ContentItemBodyImperative | null> | null): number {
  switch (styling) {
    case "comment":
      return 12;
    // messageLeft is for messages by the current user, and indicates the inline react button should be to the left of the message item (since the message is right-aligned)
    // messageRight is for messages by other users, and indicates the inline react button should be to the right of the message item (since the message is left-aligned)
    // The messageLeft and messageRight values were chosen empirically to avoid overlap between the button background and the message container.
    case "messageLeft":
      const anchorElWidth = (contentRef?.current?.getAnchorEl()?.getBoundingClientRect().width ?? 0) + 64;
      return anchorElWidth * -1;
    case "messageRight":
      return 0;
    case "post":
    case "tag":
      return 30;
  }
}

function getButtonOffsetTop(styling: Styling): number {
  switch (styling) {
    case "comment":
    case "messageLeft":
    case "messageRight":
      return -10;
    case "post":
    case "tag":
      return 0;
  }
}

const InlineReactSelectionWrapper = ({contentRef, voteProps, styling, setSelection, children}: {
  contentRef?: React.RefObject<ContentItemBodyImperative|null>|null, // we need this to check if the mouse is still over the comment, and it needs to be passed down from CommentsItem instead of declared here because it needs extra padding in order to behave intuively (without losing the selection)
  voteProps: VotingProps<VoteableTypeClient>
  styling: Styling,
  setSelection?: (selection?: { text: string, disabled: boolean }) => void,
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const commentTextRef = useRef<HTMLDivElement|null>(null);
  const popupRef = useRef<HTMLDivElement|null>(null);
  const [quote, setQuote] = useState<string>("");
  const [anchorEl, setAnchorEl] = useState<HTMLElement|null>(null);
  const [yOffset, setYOffset] = useState<number>(0);
  const [disabledButton, setDisabledButton] = useState<boolean>(false);
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);
  const isNarrowScreen = !useIsAboveBreakpoint('sm');
  const useMobileToolbar = styling === 'post' && isNarrowScreen;
  const clearAll = useCallback(() => {
    setAnchorEl(null);
    setQuote("");
    setDisabledButton(false);
    setSelectionRange(null);
    setMobilePaletteOpen(false);
    setSelection?.();
  }, [setSelection]);
  const detectSelection = useCallback((): void => {
    // Focusing the reaction search field can clear the native selection. Keep
    // the selected quote until the picker is dismissed or a reaction is chosen.
    if (useMobileToolbar && mobilePaletteOpen) return;
  
    const selection = window.getSelection()
    const selectedText = selection?.toString() ?? ""
    const selectionAnchorNode = selection?.anchorNode
    if (!selectionAnchorNode) {
      clearAll()
      return
    }

    const selectionInCommentRef = contentRef?.current?.containsNode(selectionAnchorNode)
      && !!selection?.focusNode && contentRef?.current?.containsNode(selection.focusNode);
    const selectionInPopupRef = popupRef.current?.contains(selectionAnchorNode);

    if (selectionInCommentRef && !selectionInPopupRef) {
      const anchorEl = contentRef?.current?.getAnchorEl();
      
      if (anchorEl instanceof HTMLElement && selectedText.length > (useMobileToolbar ? 0 : 1) && selection?.rangeCount === 1) {
        setAnchorEl(anchorEl);
        setQuote(selectedText);
        setYOffset(getYOffsetFromDocument(selection, commentTextRef));
        setSelectionRange(selection.getRangeAt(0).cloneRange());
        const commentText = contentRef?.current?.getText() ?? "";
        // Count the number of occurrences of the quote in the raw text
        const count = countStringsInString(commentText, selectedText);
        setDisabledButton(count > 1)
        setSelection?.({ text: selectedText, disabled: count > 1 })
      } else {
        clearAll()
      }
    }
    if (!selectionInCommentRef && !selectionInPopupRef) {
      clearAll()
    }
  }, [contentRef, commentTextRef, setSelection, clearAll, useMobileToolbar, mobilePaletteOpen]);
  
  useEffect(() => { 
    document.addEventListener('selectionchange', detectSelection);
    return () => {
      document.removeEventListener('selectionchange', detectSelection);
    };
  }, [detectSelection]);
  
  const buttonOffsetLeft = getButtonOffsetLeft(styling, contentRef);
  const buttonOffsetTop = getButtonOffsetTop(styling);

  return (
    <div ref={commentTextRef}>
      {!setSelection && useMobileToolbar && selectionRange && <MobilePostSelectionToolbar
        range={selectionRange}
        quote={quote}
        voteProps={voteProps}
        disabled={disabledButton}
        paletteOpen={mobilePaletteOpen}
        onPaletteOpen={setMobilePaletteOpen}
        onClose={clearAll}
      />}
      {!setSelection && !useMobileToolbar && <LWPopper
        className={classes.popper}
        open={!!anchorEl} anchorEl={anchorEl}
        placement="right"
        allowOverflow={true}
      >
        <span ref={popupRef} className={classes.button}
          style={{position:"relative", top: yOffset+buttonOffsetTop, marginLeft: buttonOffsetLeft}}
        >
          <AddInlineReactionButton quote={quote} voteProps={voteProps} disabled={disabledButton}/>
        </span> 
      </LWPopper>}

      {children}
    </div>
  );
}

function getYOffsetFromDocument (selection: Selection, commentTextRef: React.RefObject<HTMLDivElement|null>) {
  const commentTextRect = commentTextRef.current?.getBoundingClientRect();
  if (!commentTextRect) return 0;

  const documentCenter = commentTextRect?.top + (commentTextRect?.height / 2);
  const selectionRectTop = selection.getRangeAt(0).getBoundingClientRect().top;
  
  return selectionRectTop - documentCenter;
}

/** Count instances of a smaller string 'needle' in a larger string 'haystack'. */
function countStringsInString(haystack: string, needle: string): number {
  let count = 0;
  let index = 0;
  while ((index = haystack.indexOf(needle, index)) !== -1) {
    count++;
    index += needle.length;
  }
  return count;
}

export default InlineReactSelectionWrapper


