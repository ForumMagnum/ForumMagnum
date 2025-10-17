import React, { useRef } from 'react';
import type { NamesAttachedReactionsMessageBottomProps } from '@/lib/voting/votingSystemTypes';
import { reactionsListToDisplayedNumbers, getNormalizedReactionsListFromVoteProps } from '@/lib/voting/reactionDisplayHelpers';
import { useCurrentUserId } from '../../common/withUser';
import { AddReactionButton, HoverableReactionIcon } from './NamesAttachedReactionsVoteOnComment';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import AddInlineReactionButton from './AddInlineReactionButton';

const styles = defineStyles("NamesAttachedReactionsMessageBottom", (theme: ThemeType) => ({
  reactionsContainer: {
    position: 'absolute',
    bottom: -10,
    right: 8,
    display: 'flex',
    alignItems: 'center',
    zIndex: theme.zIndexes.reactionsFooter,
  },
  addReactionButtonContainer: {
    position: 'absolute',
    top: -10,
    right: -10,
    transition: 'opacity 0.2s ease-in-out',
    zIndex: theme.zIndexes.reactionsFooter,
    background: theme.palette.background.paper,
    height: 24,
    width: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
  },
  hidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  visible: {
    opacity: 1,
    pointerEvents: 'auto',
  },
  footerReactions: {
    background: theme.palette.grey[700],
  },
  footerReactionsCurrentUser: {
    background: theme.palette.grey[200],
  },
  footerReactionsSingle: {
    borderRadius: '50%',
  },
  footerReactionsMultiple: {
    display: 'flex',
    borderRadius: 13,
  },
  footerReaction: {
    lineHeight: 1,
    display: "flex",
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    width: 20,
    height: 20,
    borderRadius: '50%',
  },
  reactionCount: {
    fontSize: 11,
    fontFamily: theme.typography.commentStyle.fontFamily,
    color: theme.palette.text.dim60,
    marginLeft: 2,
    verticalAlign: "middle",
    display: 'none',
  },
  showCount: {
    display: 'inline',
  },
  invertColors: {
    filter: "invert(1)",
  },
  footerSelected: {
    background: theme.palette.panelBackground.darken10,
  },
  footerSelectedInverted: {
    background: theme.palette.grey[600],
  },
  footerSelectedAnti: {
    background: theme.palette.namesAttachedReactions.selectedAnti,
  },
  hasQuotes: {
    border: theme.palette.border.dashed500
  },
  mouseHoverTrap: {
    position: "absolute",
    right: 0,
    height: 50,
  },
  footerReactionHover: {
    width: 300,
  },
  footerReactionSpacer: {
    display: "inline-block",
    width: 2,
  },
  inlineReactionButtonTooltip: {
    height: 20,
  },
  inlineReactionButtonIcon: {
    width: 20,
    height: 20,
    padding: 'unset',
    "&:hover": {
      background: 'unset',
    },
    borderRadius: '50%',
    opacity: 0.15,
  },
  currentUserPalettePositioning: {
    right: -10,
    left: 'unset',
    top: 0,
  },
  otherUserPalettePositioning: {
    left: -10,
    right: 'unset',
    top: 0,
  },
}), { stylePriority: 1 });

const NamesAttachedReactionsMessageBottom = ({
  voteProps,
  invertColors = false,
  isCurrentUser = false,
  showReactionButton = false,
  selection,
}: NamesAttachedReactionsMessageBottomProps) => {
  const classes = useStyles(styles);
  const currentUserId = useCurrentUserId();
  const reactionRowRef = useRef<HTMLDivElement | null>(null);

  const reactionsList = getNormalizedReactionsListFromVoteProps(voteProps);
  const visibleReactionsDisplay = reactionsListToDisplayedNumbers(reactionsList?.reacts ?? null, currentUserId);

  const nonQuoteReactions = visibleReactionsDisplay.filter(r => !reactionsList?.reacts?.[r.react]?.every(r => r.quotes?.length));

  const reactionRowContainerClass = classNames(
    isCurrentUser ? classes.footerReactionsCurrentUser : classes.footerReactions,
    nonQuoteReactions.length === 1 ? classes.footerReactionsSingle : classes.footerReactionsMultiple
  );

  return (
    <>
      {nonQuoteReactions.length > 0 && (
        <div className={classes.reactionsContainer} ref={reactionRowRef}>
          <div className={reactionRowContainerClass}>
            {nonQuoteReactions.map(({ react, numberShown }) => (
              <HoverableReactionIcon
                key={react}
                reactionRowRef={reactionRowRef}
                react={react}
                numberShown={numberShown}
                voteProps={voteProps}
                invertColors={!invertColors}
                quote={null}
                style="message"
              />
            ))}
          </div>
        </div>
      )}

      <div
        className={classNames(
          classes.addReactionButtonContainer,
          showReactionButton ? classes.visible : classes.hidden,
        )}
      >
        {selection
          ? <AddInlineReactionButton  
              voteProps={voteProps}
              quote={selection.text}
              disabled={selection.disabled}
              wrapperClassName={classes.inlineReactionButtonTooltip}
              iconClassName={classes.inlineReactionButtonIcon}
              paletteClassName={isCurrentUser ? classes.currentUserPalettePositioning : classes.otherUserPalettePositioning}
            />
          : <AddReactionButton title="Add reaction" voteProps={voteProps} />
        }
      </div>
    </>
  );
};

export default NamesAttachedReactionsMessageBottom;
