import React, { useRef, useContext } from 'react';
import type { NamesAttachedReactionsMessageBottomProps } from '@/lib/voting/votingSystemTypes';
import type { QuoteLocator, NamesAttachedReactionsList, EmojiReactName, UserReactInfo } from '../../../lib/voting/namesAttachedReactions';
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

const styles = defineStyles("NamesAttachedReactionsMessageBottom", (theme: ThemeType) => ({
  reactionsContainer: {
    position: 'absolute',
    bottom: -13,
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
    display: "inline-block",
    fontSize: 25,
    lineHeight: 0.6,
    height: 26,
    textAlign: 'center',
    whiteSpace: "nowrap",
    marginRight: 6,
  },
  footerReaction: {
    height: 26,
    display: "inline-block",
    borderRadius: 8,
    paddingLeft: 7,
    paddingRight: 7,
    "&:hover": {
      background: theme.palette.panelBackground.darken04,
    },
  },
  footerReactionSpacer: {
    display: "inline-block",
    width: 2,
  },
  reactionCount: {
    fontSize: 13,
    fontFamily: theme.typography.commentStyle.fontFamily,
    color: theme.palette.text.dim60,
    marginLeft: 3,
    paddingBottom: 2,
    verticalAlign: "middle",
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
  isHovered = false,
}: NamesAttachedReactionsMessageBottomProps) => {
  const classes = useStyles(styles);
  const currentUserId = useCurrentUserId();

  const reactionsList = getNormalizedReactionsListFromVoteProps(voteProps);
  const visibleReactionsDisplay = reactionsListToDisplayedNumbers(reactionsList?.reacts ?? null, currentUserId);

  return (
    <>
      {/* Existing reactions positioned at bottom-right */}
      {visibleReactionsDisplay.length > 0 && (
        <div className={classes.reactionsContainer}>
          <span className={classes.footerReactions}>
            {visibleReactionsDisplay.map(({ react, numberShown }) => (
              <span key={react}>
                <HoverableReactionIcon
                  react={react}
                  numberShown={numberShown}
                  voteProps={voteProps}
                  invertColors={invertColors}
                />
              </span>
            ))}
          </span>
        </div>
      )}

      {/* Add reaction button positioned on left/right based on user */}
      <div
        className={classNames(
          classes.addReactionButtonContainer,
          isCurrentUser ? classes.addReactionButtonContainerLeft : classes.addReactionButtonContainerRight,
          isHovered ? classes.visible : classes.hidden
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
  const { getCurrentUserReaction, getCurrentUserReactionVote, toggleReaction } = useNamesAttachedReactionsVoting(voteProps);
  const currentUserReactionVote = getCurrentUserReactionVote(react, quote);
  const currentUserReaction = getCurrentUserReaction(react, quote);
  const setHoveredReaction = useContext(SetHoveredReactionContext);
  const reactionIconRef = useRef<HTMLSpanElement | null>(null);

  const alreadyUsedReactions: NamesAttachedReactionsList | undefined = getNormalizedReactionsListFromVoteProps(voteProps)?.reacts;
  const reactions: UserReactInfo[] = alreadyUsedReactions?.[react] ?? [];
  const quotes = reactions.flatMap(r => r.quotes);
  const quotesWithUndefinedRemoved = quotes.filter(q => q !== undefined);

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

  const showDefaultBackground = currentUserReactionVote === "created" || currentUserReactionVote === "seconded";
  const showInvertedBackground = invertColors && (currentUserReactionVote === "created" || currentUserReactionVote === "seconded");

  return (
    <span onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} ref={reactionIconRef}>
      <span
        className={classNames(
          classes.footerReaction,
          {
            [classes.footerSelected]: showDefaultBackground,
            [classes.footerSelectedInverted]: showInvertedBackground,
            [classes.footerSelectedAnti]: currentUserReactionVote === "disagreed",
            [classes.hasQuotes]: quotesWithUndefinedRemoved.length > 0,
          }
        )}
      >
        <span onMouseDown={() => { reactionClicked(react); }}>
          <ReactionIcon react={react} inverted={invertColors} />
        </span>
        <span className={classNames(classes.reactionCount, {
          [classes.invertColors]: invertColors,
        })}>
          {numberShown}
        </span>
      </span>

      <span className={classes.footerReactionSpacer} onMouseEnter={handleMouseEnter} />
    </span>
  );
};

export default NamesAttachedReactionsMessageBottom;
