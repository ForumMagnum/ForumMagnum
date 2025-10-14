import React, { useRef, useContext } from 'react';
import type { NamesAttachedReactionsMessageBottomProps } from '@/lib/voting/votingSystemTypes';
import type { QuoteLocator, EmojiReactName } from '../../../lib/voting/namesAttachedReactions';
import { reactionsListToDisplayedNumbers, getNormalizedReactionsListFromVoteProps } from '@/lib/voting/reactionDisplayHelpers';
import { useCurrentUserId } from '../../common/withUser';
import { useNamesAttachedReactionsVoting, AddReactionButton } from './NamesAttachedReactionsVoteOnComment';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import type { VotingProps } from '../votingProps';
import { useHover } from '../../common/withHover';
import { SetHoveredReactionContext } from './HoveredReactionContextProvider';
import { isMobile } from '../../../lib/utils/isMobile';
import ReactionIcon from "../ReactionIcon";
import LWTooltip from "../../common/LWTooltip";

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
    bottom: 0,
    transition: 'opacity 0.2s ease-in-out',
    zIndex: theme.zIndexes.reactionsFooter,
  },
  addReactionButtonContainerLeft: {
    left: -16,
  },
  addReactionButtonContainerRight: {
    right: -24,
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
    background: theme.palette.background.default,
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
}));

const NamesAttachedReactionsMessageBottom = ({
  voteProps,
  invertColors = false,
  isCurrentUser = false,
  showReactionButton = false,
}: NamesAttachedReactionsMessageBottomProps) => {
  const classes = useStyles(styles);
  const currentUserId = useCurrentUserId();

  const reactionsList = getNormalizedReactionsListFromVoteProps(voteProps);
  const visibleReactionsDisplay = reactionsListToDisplayedNumbers(reactionsList?.reacts ?? null, currentUserId);

  return (
    <>
      {visibleReactionsDisplay.length > 0 && (
        <div className={classes.reactionsContainer}>
          <div className={classNames(
            isCurrentUser ? classes.footerReactionsCurrentUser : classes.footerReactions,
            visibleReactionsDisplay.length === 1 ? classes.footerReactionsSingle : classes.footerReactionsMultiple
          )}>
            {visibleReactionsDisplay.map(({ react, numberShown }) => (
              <HoverableReactionIcon
                key={react}
                react={react}
                numberShown={numberShown}
                voteProps={voteProps}
                invertColors={!invertColors}
              />
            ))}
          </div>
        </div>
      )}

      <div
        className={classNames(
          classes.addReactionButtonContainer,
          isCurrentUser ? classes.addReactionButtonContainerLeft : classes.addReactionButtonContainerRight,
          showReactionButton ? classes.visible : classes.hidden
        )}
      >
        <AddReactionButton voteProps={voteProps} />
      </div>
    </>
  );
};

const HoverableReactionIcon = ({
  react,
  numberShown,
  voteProps,
  quote = null,
  invertColors = false,
}: {
  react: string;
  numberShown: number;
  voteProps: VotingProps<VoteableTypeClient>;
  quote?: QuoteLocator | null;
  invertColors?: boolean;
}) => {
  const classes = useStyles(styles);
  const { eventHandlers: { onMouseOver, onMouseLeave } } = useHover();
  const { getCurrentUserReaction, toggleReaction } = useNamesAttachedReactionsVoting(voteProps);
  const currentUserReaction = getCurrentUserReaction(react, quote);
  const setHoveredReaction = useContext(SetHoveredReactionContext);
  const reactionIconRef = useRef<HTMLSpanElement | null>(null);

  function reactionClicked(reaction: EmojiReactName) {
    if (isMobile() || currentUserReaction?.quotes?.length) return;
    toggleReaction(reaction, quote);
  }

  function handleMouseEnter(e: React.MouseEvent<HTMLElement>) {
    setHoveredReaction?.({ reactionName: react, isHovered: true, quote: null });
    onMouseOver(e);
  }

  function handleMouseLeave(ev: React.MouseEvent<HTMLElement>) {
    setHoveredReaction?.({ reactionName: react, isHovered: false, quote: null });
    onMouseLeave(ev);
  }

  const showCount = numberShown > 1;
  
  const tooltipContent = react.slice(0, 1).toUpperCase() + react.slice(1);

  return (
    <LWTooltip title={tooltipContent} placement="top">
      <span 
        onMouseEnter={handleMouseEnter} 
        onMouseLeave={handleMouseLeave} 
        ref={reactionIconRef}
        className={classes.footerReaction}
        onMouseDown={() => { reactionClicked(react); }}
      >
        <ReactionIcon react={react} inverted={invertColors} size={14} />
        {showCount && (
          <span className={classNames(classes.reactionCount, classes.showCount, {
            [classes.invertColors]: invertColors,
          })}>
            {numberShown}
          </span>
        )}
      </span>
    </LWTooltip>
  );
};

export default NamesAttachedReactionsMessageBottom;
