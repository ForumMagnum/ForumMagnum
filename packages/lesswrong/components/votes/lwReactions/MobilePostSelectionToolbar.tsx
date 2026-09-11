import React, { useContext, useLayoutEffect, useMemo, useRef } from 'react';
import type { State } from '@popperjs/core';
import CommentIcon from '@/lib/vendor/@material-ui/icons/src/ModeComment';
import { AnalyticsContext, useTracking } from '@/lib/analyticsEvents';
import { QuoteLocator } from '@/lib/voting/namesAttachedReactions';
import { CommentOnSelectionContext } from '@/components/comments/CommentOnSelection';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ForumIcon from '@/components/common/ForumIcon';
import LWPopper from '@/components/common/LWPopper';
import LWClickAwayListener from '@/components/common/LWClickAwayListener';
import ReactionsPalette from '../ReactionsPalette';
import { VotingProps } from '../votingProps';
import { useNamesAttachedReactionsVoting } from './NamesAttachedReactionsVoteOnComment';

const styles = defineStyles('MobilePostSelectionToolbar', (theme: ThemeType) => ({
  toolbar: {
    display: 'flex',
    padding: 4,
    borderRadius: 8,
    background: theme.palette.background.pageActiveAreaBackground,
    boxShadow: theme.shadows[2],
    color: theme.palette.icon.dim,
    userSelect: 'none',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    padding: 0,
    border: 'none',
    borderRadius: 4,
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    '&:hover': {
      background: theme.palette.panelBackground.darken08,
    },
    '&:disabled': {
      opacity: 0.25,
    },
  },
  palette: {
    width: 'min(350px, calc(100vw - 16px))',
    maxHeight: 'calc(100dvh - 16px)',
    overflowY: 'auto',
    borderRadius: 8,
    paddingTop: 12,
    background: theme.palette.background.pageActiveAreaBackground,
    boxShadow: theme.shadows[2],
    fontFamily: theme.typography.commentStyle.fontFamily,
    '& .ReactionsPalette-reactionPaletteScrollRegion': {
      maxWidth: '100%',
    },
  },
}));

function preserveSelection(event: React.PointerEvent) {
  // Safari clears native selections on press, before a click can be handled.
  event.preventDefault();
}

function rangeToBlockquoteHTML(range: Range): string {
  const container = document.createElement('div');
  container.appendChild(range.cloneContents());
  return `<blockquote>${container.innerHTML}</blockquote><p></p>`;
}

const MobilePostSelectionToolbar = ({range, quote, voteProps, disabled, paletteOpen, onPaletteOpen, onClose}: {
  range: Range,
  quote: string,
  voteProps: VotingProps<VoteableTypeClient>,
  disabled: boolean,
  paletteOpen: boolean,
  onPaletteOpen: (open: boolean) => void,
  onClose: () => void,
}) => {
  const classes = useStyles(styles);
  const onClickComment = useContext(CommentOnSelectionContext);
  const { captureEvent } = useTracking();
  const { getCurrentUserReactionVote, toggleReaction } = useNamesAttachedReactionsVoting(voteProps);
  const selectionHtml = useMemo(() => rangeToBlockquoteHTML(range), [range]);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const updateRef = useRef<(() => Promise<Partial<State>>) | null>(null);

  useLayoutEffect(() => {
    const popup = popupRef.current;
    if (!popup) return;
    // Popper listens for scrolling/resizing the window, but does not observe
    // changes to the popup itself (opening the picker, searching, Show All) or
    // the page height (e.g. comments loading below a bottom-positioned popper).
    const observer = new ResizeObserver(() => {
      void updateRef.current?.();
    });
    observer.observe(popup);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  const comment = () => {
    captureEvent('commentOnSelectionClicked');
    onClickComment?.(selectionHtml);
    onClose();
  };

  const react = (reaction: string, selectedQuote: QuoteLocator | null) => {
    toggleReaction(reaction, selectedQuote);
    onClose();
  };

  // Range is a Popper virtual element: its bounding rect follows the selected
  // text when the page scrolls or reflows. Popper keeps both views on screen.
  return <LWPopper
    open
    anchorEl={range}
    placement="top"
    distance={12}
    overflowPadding={8}
    preventOverflowOnBothAxes={paletteOpen}
    updateRef={updateRef}
  >
    <div ref={popupRef}>
      {paletteOpen ? <LWClickAwayListener onClickAway={onClose}>
        <div className={classes.palette}>
          <ReactionsPalette
            getCurrentUserReactionVote={getCurrentUserReactionVote}
            toggleReaction={react}
            quote={quote}
          />
        </div>
      </LWClickAwayListener> : <AnalyticsContext pageElementContext="selectedTextToolbar">
        <div className={classes.toolbar} role="toolbar" aria-label="Selected text actions">
          {onClickComment && <button
            type="button"
            className={classes.button}
            aria-label="Comment on selected text"
            onPointerDown={preserveSelection}
            onClick={comment}
          >
            <CommentIcon />
          </button>}
          <button
            type="button"
            className={classes.button}
            aria-label="React to selected text"
            title={disabled ? 'Select a unique snippet to react' : 'React to selected text'}
            disabled={disabled}
            onPointerDown={preserveSelection}
            onClick={() => onPaletteOpen(true)}
          >
            <ForumIcon icon="AddReaction" />
          </button>
        </div>
      </AnalyticsContext>}
    </div>
  </LWPopper>;
};

export default MobilePostSelectionToolbar;
