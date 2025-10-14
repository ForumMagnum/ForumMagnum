import React, { useRef, useContext, RefObject } from 'react';
import type { NamesAttachedReactionsMessageBottomProps } from '@/lib/voting/votingSystemTypes';
import type { QuoteLocator, EmojiReactName, NamesAttachedReactionsList, UserReactInfo } from '../../../lib/voting/namesAttachedReactions';
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
import LWPopper from '@/components/common/LWPopper';
import { ContentItemBodyImperative } from '@/components/contents/contentBodyUtil';
import { Card } from '@/components/widgets/Paper';
import filter from 'lodash/filter';
import uniq from 'lodash/uniq';
import { slugify } from '@/lib/utils/slugify';
import { filterNonnull } from '@/lib/utils/typeGuardUtils';
import ReactionHoverTopRow from './ReactionHoverTopRow';
import ReactionQuotesHoverInfo from './ReactionQuotesHoverInfo';
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
}));

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
              tooltipClassName={classes.inlineReactionButtonTooltip}
              iconClassName={classes.inlineReactionButtonIcon}
            />
          : <AddReactionButton title="Add reaction" voteProps={voteProps} />
        }
      </div>
    </>
  );
};

const HoverableReactionIcon = ({reactionRowRef, react, numberShown, voteProps, quote, commentBodyRef, invertColors=false}: {
  // reactionRowRef: Reference to the row of reactions, used as an anchor for the
  // hover instead of the individual icon, so that the hover's position stays
  // consistent as you move the mouse across the row.
  reactionRowRef: RefObject<HTMLElement|null>,
  react: string,
  numberShown: number,
  voteProps: VotingProps<VoteableTypeClient>,
  quote: QuoteLocator|null,
  commentBodyRef?: React.RefObject<ContentItemBodyImperative|null>|null,
  invertColors?: boolean,
}) => {
  const classes = useStyles(styles);
  const { hover, eventHandlers: {onMouseOver, onMouseLeave} } = useHover();
  const { getCurrentUserReaction, getCurrentUserReactionVote, toggleReaction } = useNamesAttachedReactionsVoting(voteProps);
  const currentUserReactionVote = getCurrentUserReactionVote(react, quote);
  const currentUserReaction = getCurrentUserReaction(react, quote)
  const setHoveredReaction = useContext(SetHoveredReactionContext);

  const alreadyUsedReactions: NamesAttachedReactionsList|undefined = getNormalizedReactionsListFromVoteProps(voteProps)?.reacts;
  const reactions: UserReactInfo[] = alreadyUsedReactions?.[react] ?? []
  const quotes = reactions.flatMap(r => r.quotes)
  const quotesWithUndefinedRemoved = filter(quotes, q => q !== undefined) as string[]

  function reactionClicked(reaction: EmojiReactName) {
    // The only way to "hover" over reactions to see who left them on mobile is to click on them
    // So let's not actually have clicking on a reaction cause the user to apply it, when on mobile
    // They can still apply it from the displayed summary card, if they want
    if (isMobile() || currentUserReaction?.quotes?.length) return
    toggleReaction(reaction, quote);
  }

  function handleMouseEnter (e: any) {
    setHoveredReaction?.({reactionName: react, isHovered: true, quote: null});
    onMouseOver(e);
  }
  
  function handleMouseLeave (ev: React.MouseEvent<HTMLElement>) {
    setHoveredReaction?.({reactionName: react, isHovered: false, quote: null});
    onMouseLeave(ev);
  }

  const showDefaultBackground = currentUserReactionVote==="created"||currentUserReactionVote==="seconded"
  const showInvertedBackground = invertColors && (currentUserReactionVote==="created"||currentUserReactionVote==="seconded")

  return <span onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
    <span
      className={classNames(
        classes.footerReaction,
        {
          [classes.hasQuotes]: quotesWithUndefinedRemoved.length > 0,
        },
      )}
    >
      <span onMouseDown={()=>{reactionClicked(react)}}>
        <ReactionIcon react={react} inverted={invertColors} />
      </span>
      <span className={classNames(classes.reactionCount, {
        [classes.invertColors]: invertColors,
      })}>
        {numberShown}
      </span>
  
      {hover && reactionRowRef?.current && <LWPopper
        open={!!hover} anchorEl={reactionRowRef.current}
        placement="bottom-end"
        allowOverflow={true}
      >
        {/*
          Add a 50px hoverable spacer left of the popup, below the reactions list,
          so that the mouse has somewhere hoverable to cross when going from the
          leftmost reactions to the hover form.
        */}
        <div className={classes.mouseHoverTrap} style={{width: reactionRowRef.current.clientWidth}}/>
        <Card>
          <NamesAttachedReactionsHoverSingleReaction
            react={react} voteProps={voteProps}
            commentBodyRef={commentBodyRef}
          />
        </Card>
      </LWPopper>}
    </span>
  </span>
}

const NamesAttachedReactionsHoverSingleReaction = ({react, voteProps, commentBodyRef}: {
  react: EmojiReactName,
  voteProps: VotingProps<VoteableTypeClient>,
  commentBodyRef?: React.RefObject<ContentItemBodyImperative|null>|null
}) => {
  const classes = useStyles(styles);
  const normalizedReactions = getNormalizedReactionsListFromVoteProps(voteProps);
  const alreadyUsedReactions: NamesAttachedReactionsList = normalizedReactions?.reacts ?? {};
  const relevantReactions = alreadyUsedReactions[react] ?? [];

  // Don't show the "general" (non-quote-specific) ballot for this react if all the instances of this react are inline (quote-specific)
  const allReactsAreInline = relevantReactions.every(r => r.quotes?.length);

  const allQuotes = filterNonnull(uniq(relevantReactions?.flatMap(r => r.quotes)))

  return <div className={classes.footerReactionHover}>
    <ReactionHoverTopRow
      reactionName={react}
      userReactions={relevantReactions}
      showNonInlineVoteButtons={!allReactsAreInline}
      voteProps={voteProps}
    />
    {allQuotes.map(quote => <ReactionQuotesHoverInfo
      key={`${react}-${slugify(quote)}`}
      react={react}
      quote={quote}
      voteProps={voteProps}
      commentBodyRef={commentBodyRef}
    />)}
  </div>
}

export default NamesAttachedReactionsMessageBottom;
