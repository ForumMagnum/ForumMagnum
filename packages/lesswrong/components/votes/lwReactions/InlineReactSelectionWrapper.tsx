import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { ContentItemBodyImperative } from '../../contents/contentBodyUtil';
import type { VotingProps } from '../votingProps';
import { AddInlineReactionButton, AddInlineReactionDialog } from "./AddInlineReactionButton";
import LWPopper from "../../common/LWPopper";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { AddClaimDialog, AddClaimProbabilityButton, InlinePredictionOps } from './AddClaimProbabilityButton';
import { CommentOnSelectionButton } from '@/components/comments/CommentOnSelection';

const styles = defineStyles("SelectedTextToolbarWrapper", (theme: ThemeType) => ({
  popper: {
    height: 0,
  },
  textToolbar: {
    display: "block",
    height: 40,
    zIndex: 10000,
    background: theme.palette.panelBackground.default,
    border: theme.palette.border.normal,
    boxShadow: theme.palette.boxShadow.faint,
    borderRadius: 8,
    position: "relative",
    left: 12,
  },
  inlineReactButton: {
    color: theme.palette.greyAlpha(0.7),
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

const SelectedTextToolbarWrapper = ({
  enableCommentOnSelection, enableInlineReacts, enableInlinePredictions,
  contentRef, voteProps, styling, documentId, collectionName, inlinePredictionOps,
  setSelection, children
}: {
  enableCommentOnSelection?: boolean,
  enableInlineReacts?: boolean,
  enableInlinePredictions?: boolean,
  contentRef?: React.RefObject<ContentItemBodyImperative|null>|null, // we need this to check if the mouse is still over the comment, and it needs to be passed down from CommentsItem instead of declared here because it needs extra padding in order to behave intuively (without losing the selection)
  voteProps?: VotingProps<VoteableTypeClient>
  styling: Styling,
  documentId: string,
  collectionName: CollectionNameString,
  inlinePredictionOps: InlinePredictionOps,
  setSelection?: (selection?: { text: string, disabled: boolean }) => void,
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const commentTextRef = useRef<HTMLDivElement|null>(null);
  const popupRef = useRef<HTMLDivElement|null>(null);
  const [quote, setQuote] = useState<string>("");
  const [anchorEl, setAnchorEl] = useState<HTMLElement|null>(null);
  const [yOffset, setYOffset] = useState<number>(0);
  const [quoteIsNotDistinct, setQuoteIsNotDistinct] = useState<boolean>(false);
  
  const detectSelection = useCallback((e: MouseEvent): void => {
    function clearAll() {
      setAnchorEl(null);
      setQuote("")
      setQuoteIsNotDistinct(false)
      setSelection?.()
    }
  
    const selection = window.getSelection()
    const selectedText = selection?.toString() ?? ""
    const selectionAnchorNode = selection?.anchorNode
    if (!selectionAnchorNode) {
      clearAll()
      return
    }

    const selectionInCommentRef = contentRef?.current?.containsNode(selectionAnchorNode);
    const selectionInPopupRef = popupRef && popupRef.current?.contains(selectionAnchorNode as Node);

    if (selectionInCommentRef && !selectionInPopupRef) {
      const anchorEl = contentRef?.current?.getAnchorEl();
      
      if (anchorEl instanceof HTMLElement && selectedText.length > 1 ) {
        setAnchorEl(anchorEl);
        setQuote(selectedText);
        setYOffset(getYOffsetFromDocument(selection, commentTextRef));
        const commentText = contentRef?.current?.getText() ?? "";
        // Count the number of occurrences of the quote in the raw text
        const count = countStringsInString(commentText, selectedText);
        setQuoteIsNotDistinct(count > 1)
        setSelection?.({ text: selectedText, disabled: count > 1 })
      } else {
        clearAll()
      }
    }
    if (!selectionInCommentRef && !selectionInPopupRef) {
      clearAll()
    }
  }, [contentRef, commentTextRef, setSelection]);
  
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
      {!setSelection && <LWPopper
        className={classes.popper}
        open={!!anchorEl} anchorEl={anchorEl}
        placement="right"
        allowOverflow={true}
      >
        <span ref={popupRef} className={classes.textToolbar}
          style={{position:"relative", top: yOffset+buttonOffsetTop, marginLeft: buttonOffsetLeft}}
        >
          <SelectedTextToolbar
            quote={quote}
            quoteIsNotDistinct={quoteIsNotDistinct}
            voteProps={voteProps}
            documentId={documentId}
            collectionName={collectionName}
            enableCommentOnSelection={!!enableCommentOnSelection}
            enableInlineReacts={!!enableInlineReacts}
            enableInlinePredictions={!!enableInlinePredictions}
            inlinePredictionOps={inlinePredictionOps}
          />
        </span> 
      </LWPopper>}

      {children}
    </div>
  );
}

const SelectedTextToolbar = ({ enableCommentOnSelection, enableInlineReacts, enableInlinePredictions, quote, quoteIsNotDistinct, voteProps, documentId, collectionName, inlinePredictionOps }: {
  enableCommentOnSelection: boolean,
  enableInlineReacts: boolean,
  enableInlinePredictions: boolean,
  quote: string,
  quoteIsNotDistinct: boolean,
  voteProps?: VotingProps<VoteableTypeClient>,
  documentId: string,
  collectionName: CollectionNameString,
  inlinePredictionOps: InlinePredictionOps
}) => {
  const classes = useStyles(styles);
  const [state, setState] = useState<"buttons"|"inlineReacts"|"probability"|"closed">("buttons");

  switch (state) {
    case "closed":
      return null;
    case "buttons":
      return <>
        {enableCommentOnSelection && <CommentOnSelectionButton
          onClick={() => setState("closed")}
        />}
        {enableInlineReacts && voteProps && <AddInlineReactionButton
          onClick={() => setState("inlineReacts")}
          className={classes.inlineReactButton}
          quoteIsNotDistinct={quoteIsNotDistinct}
        />}
        {enableInlinePredictions && <AddClaimProbabilityButton
          onClick={() => setState("probability")}
        />}
      </>
    case "inlineReacts":
      return <AddInlineReactionDialog
        voteProps={voteProps!}
        quote={quote}
        onClose={() => setState("closed")}
      />
    case "probability":
      return <AddClaimDialog
        documentId={documentId}
        collectionName={collectionName}
        quote={quote}
        inlinePredictionOps={inlinePredictionOps}
        onClose={() => setState("closed")}
      />
  }
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

export default SelectedTextToolbarWrapper;


