import React, { useState, useRef, RefObject, useContext } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { CommentVotingComponentProps, NamesAttachedReactionsCommentBottomProps, } from '../../../lib/voting/votingSystems';
import { NamesAttachedReactionsList, NamesAttachedReactionsVote, EmojiReactName, UserReactInfo, UserVoteOnSingleReaction, VoteOnReactionType, reactionsListToDisplayedNumbers, getNormalizedReactionsListFromVoteProps, getNormalizedUserVoteFromVoteProps, QuoteLocator } from '../../../lib/voting/namesAttachedReactions';
import { getNamesAttachedReactionsByName } from '../../../lib/voting/reactions';
import type { VotingProps } from '../votingProps';
import classNames from 'classnames';
import { useCurrentUser } from '../../common/withUser';
import { useVote } from '../withVote';
import { useHover } from '../../common/withHover';
import { useDialog } from '../../common/withDialog';
import withErrorBoundary from '../../common/withErrorBoundary';
import filter from 'lodash/filter';
import orderBy from 'lodash/orderBy';
import sumBy from 'lodash/sumBy';
import { Card } from "@/components/widgets/Paper";
import FormatListBulletedIcon from "@/lib/vendor/@material-ui/icons/src/FormatListBulleted"
import { AddReactionIcon } from '../../icons/AddReactionIcon';
import difference from 'lodash/difference';
import uniq from 'lodash/uniq';
import { useTracking } from "../../../lib/analyticsEvents";
import { getConfirmedCoauthorIds } from '../../../lib/collections/posts/helpers';
import type { ContentItemBody } from '../../common/ContentItemBody';
import { SetHoveredReactionContext } from './HoveredReactionContextProvider';
import { filterNonnull } from '../../../lib/utils/typeGuardUtils';
import { isMobile } from '../../../lib/utils/isMobile';
import { slugify } from '@/lib/utils/slugify';

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    whiteSpace: "nowrap",
  },
  footerReactions: {
    display: "inline-block",
    fontSize: 25,
    lineHeight: 0.6,
    height: 26,
    textAlign: 'center',
    whiteSpace: "nowrap",
    zIndex: theme.zIndexes.reactionsFooter,
    marginRight: 6,
  },
  footerReactionsRow: {
    display: "flex",
    alignItems: "center",
    marginLeft: 8,
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
  mouseHoverTrap: {
    position: "absolute",
    right: 0,
    height: 50,
  },
  footerReactionHover: {
    width: 300,
  },
  reactionCount: {
    fontSize: 13,
    fontFamily: theme.typography.commentStyle.fontFamily,
    color: theme.palette.text.dim60,
    marginLeft: 3,
    paddingBottom: 2,
    verticalAlign: "middle",
  },
  addReactionButton: {
    verticalAlign: "bottom",
    filter: "opacity(0.15)",
    cursor: "pointer",
    "& svg": {
      width: 20,
      height: 20,
      position: "relative",
      top: 2
    },
    "&:hover": {
      filter: "opacity(0.8)",
    },
  },
  hoverBallot: {
    fontFamily: theme.typography.commentStyle.fontFamily,
    paddingTop: 12,
    maxWidth: 350,
  },
  reactOverview: {
    background: theme.palette.background.pageActiveAreaBackground,
    fontFamily: theme.typography.commentStyle.fontFamily,
    paddingTop: 12,
    maxWidth: 350,
    borderRadius: 2,
    padding: 12
  },
  alreadyUsedReactions: {
    padding: 8
  },

  overviewSummaryRow: {
    paddingBottom: 2
  },
  footerSelected: {
    background: theme.palette.panelBackground.darken10,
  },
  footerSelectedAnti: {
    background: theme.palette.namesAttachedReactions.selectedAnti,
  },
  overviewButton: {
    opacity: .35,
    marginTop: 2,
    marginRight: 8,
    cursor: "pointer",
    height: 18,
    width: 18
  },
  reactionQuotes: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 12,
    paddingRight: 8,
    borderTop: theme.palette.border.faint,
    fontFamily: theme.typography.commentStyle.fontFamily,
  },
  hasQuotes: {
    border: theme.palette.border.dashed500
  }
})

//DEBUG: make the reaction-overview button always visible for testing access
const alwaysShowReactionOverviewButton = false;


export const useNamesAttachedReactionsVoting = (voteProps: VotingProps<VoteableTypeClient>): {
  getCurrentUserReaction: (name: EmojiReactName, quote: QuoteLocator|null) => UserVoteOnSingleReaction|null,
  getCurrentUserReactionVote: (name: EmojiReactName, quote: QuoteLocator|null) => VoteOnReactionType|null,
  toggleReaction: (name: EmojiReactName, quote: QuoteLocator|null) => void
  setCurrentUserReaction: (name: EmojiReactName, reaction: VoteOnReactionType|null, quote: QuoteLocator|null) => void,
  getAlreadyUsedReactTypesByKarma: () => EmojiReactName[],
  getAlreadyUsedReacts: () => NamesAttachedReactionsList,
} => {
  const { openDialog } = useDialog()
  const currentUser = useCurrentUser()
  const currentUserExtendedVote = getNormalizedUserVoteFromVoteProps(voteProps) ?? null;
  
  /**
   * Given a reaction type, return the user's vote on the non-inline version of
   * it (or null if they haven't reacted or have only reacted inline).
   */
  function getCurrentUserReaction(name: EmojiReactName, quote: QuoteLocator|null): UserVoteOnSingleReaction|null {
    const reacts = currentUserExtendedVote?.reacts ?? [];
    for (let i=0; i<reacts.length; i++) {
      if (reactionVoteIsMatch(reacts[i], name, quote)) {
        return reacts[i];
      }
    }
    return null;
  }

  function getCurrentUserReactionVote(name: EmojiReactName, quote: QuoteLocator|null): VoteOnReactionType|null {
    const currentUserReaction = getCurrentUserReaction(name, quote);
    return currentUserReaction ? currentUserReaction.vote : null
  }

  function openLoginDialog() {
    openDialog({
      componentName: "LoginPopup",
      componentProps: {}
    })
  }

  async function toggleReaction(name: string, quote: QuoteLocator|null) {
    if (!currentUser) {
      openLoginDialog();
      return;
    }
    const shouldClearUserReaction = !!getCurrentUserReactionVote(name, quote);

    if (shouldClearUserReaction) {
      await clearCurrentUserReaction(name, quote);
    } else {
      const initialVote = "created"; //TODO: "created" vs "seconded"
      await addCurrentUserReaction(name, initialVote, quote);
    }
  }

  async function addCurrentUserReaction(reactionName: EmojiReactName, vote: VoteOnReactionType, quote: QuoteLocator|null) {
    if (!currentUser) {
      openLoginDialog();
      return;
    }
    
    const oldReacts = currentUserExtendedVote?.reacts ?? [];
    const newReacts: UserVoteOnSingleReaction[] = [
      ...filter(oldReacts, r => !reactionVoteIsMatch(r, reactionName, quote)),
      {
        react: reactionName,
        vote,
        quotes: quote ? [quote] : undefined,
      }
    ]
    const newExtendedVote: NamesAttachedReactionsVote = {
      ...currentUserExtendedVote,
      reacts: newReacts
    };

    await voteProps.vote({
      document: voteProps.document,
      voteType: voteProps.document.currentUserVote || null,
      extendedVote: newExtendedVote,
      currentUser,
    });
  }

  async function clearCurrentUserReaction(reactionName: string, quote: QuoteLocator|null) {
    if (!currentUser) {
      openLoginDialog();
      return;
    }

    const oldReacts = currentUserExtendedVote?.reacts ?? [];
    const newExtendedVote: NamesAttachedReactionsVote = {
      ...currentUserExtendedVote,
      reacts: filter(oldReacts, r => !reactionVoteIsMatch(r, reactionName, quote))
    };

    await voteProps.vote({
      document: voteProps.document,
      voteType: voteProps.document.currentUserVote || null,
      extendedVote: newExtendedVote,
      currentUser,
    });
  }

  async function setCurrentUserReaction(reactionName: string, reaction: VoteOnReactionType|null, quote: QuoteLocator|null) {
    if (reaction) {
      await addCurrentUserReaction(reactionName, reaction, quote);
    } else {
      await clearCurrentUserReaction(reactionName, quote);
    }
  }

  function getAlreadyUsedReacts(): NamesAttachedReactionsList {
    const reactionsScore = getNormalizedReactionsListFromVoteProps(voteProps);
    const alreadyUsedReactions: NamesAttachedReactionsList = reactionsScore?.reacts ?? {};
    return alreadyUsedReactions
  }

  function getAlreadyUsedReactTypesByKarma(): string[] {
    const alreadyUsedReactions = getAlreadyUsedReacts()
    const alreadyUsedReactionTypes: string[] = Object.keys(alreadyUsedReactions);
    const alreadyUsedReactionTypesByKarma = orderBy(alreadyUsedReactionTypes,
      r=> (alreadyUsedReactions[r]!.length>0) ? alreadyUsedReactions[r]![0].karma : 0
    );
    return alreadyUsedReactionTypesByKarma
  }

  return {
    getCurrentUserReaction, getCurrentUserReactionVote, toggleReaction, setCurrentUserReaction, getAlreadyUsedReactTypesByKarma, getAlreadyUsedReacts
  };
}

export function reactionVoteIsMatch(react: UserVoteOnSingleReaction, name: EmojiReactName, quote: QuoteLocator|null): boolean {
  if (react.react !== name)
    return false;
  if (quote) {
    return !!(react.quotes && react.quotes.indexOf(quote)>=0);
  } else {
    return !(react.quotes?.length);
  }
}


const NamesAttachedReactionsVoteOnComment = ({document, hideKarma=false, collectionName, votingSystem, classes}: CommentVotingComponentProps & WithStylesProps) => {
  const voteProps = useVote(document, collectionName, votingSystem);
  const { OverallVoteAxis, AgreementVoteAxis } = Components;
  
  return <span className={classes.root}>
    <OverallVoteAxis
      document={document}
      hideKarma={hideKarma}
      voteProps={voteProps}
      verticalArrows
      largeArrows
    />
    <AgreementVoteAxis
      document={document}
      hideKarma={hideKarma}
      voteProps={voteProps}
    />
  </span>
}

const NamesAttachedReactionsCommentBottom = ({
  document, hideKarma=false, commentBodyRef, classes, voteProps, post
}: NamesAttachedReactionsCommentBottomProps & WithStylesProps) => {
  const anchorEl = useRef<HTMLElement|null>(null);
  const currentUser = useCurrentUser();

  const { getAlreadyUsedReactTypesByKarma } = useNamesAttachedReactionsVoting(voteProps)

  const allReactions = getAlreadyUsedReactTypesByKarma();

  const reactionsList = getNormalizedReactionsListFromVoteProps(voteProps);
  const visibleReactionsDisplay = reactionsListToDisplayedNumbers(reactionsList?.reacts ?? null, currentUser?._id);
  
  const visibleReacts = visibleReactionsDisplay.map(r => r.react)
  const hiddenReacts = difference(allReactions, visibleReacts)

  const isDebateComment = post?.debate && document.debateResponse
  const canReactUserIds = post ? [...getConfirmedCoauthorIds(post), post.userId] : []
  const userIsDebateParticipant = currentUser && canReactUserIds.includes(currentUser._id)
  const showReactButton = !isDebateComment || userIsDebateParticipant

  return <span className={classes.footerReactionsRow} ref={anchorEl}>
    {visibleReactionsDisplay.length > 0 && <span className={classes.footerReactions}>
      {visibleReactionsDisplay.map(({react, numberShown}) =>
        <span key={react} >
          <HoverableReactionIcon
            reactionRowRef={anchorEl}
            react={react}
            quote={null}
            numberShown={numberShown}
            voteProps={voteProps}
            classes={classes}
            commentBodyRef={commentBodyRef}
          />
        </span>
      )}
      {hideKarma && <AddReactionIcon />}
    </span>}
    {(hiddenReacts.length > 0 || alwaysShowReactionOverviewButton) && <ReactionOverviewButton voteProps={voteProps} classes={classes}/>}
    {showReactButton && <AddReactionButton voteProps={voteProps} classes={classes}/>}
  </span>
}

const HoverableReactionIcon = ({reactionRowRef, react, numberShown, voteProps, quote, commentBodyRef, classes}: {
  // reactionRowRef: Reference to the row of reactions, used as an anchor for the
  // hover instead of the individual icon, so that the hover's position stays
  // consistent as you move the mouse across the row.
  reactionRowRef: RefObject<HTMLElement|null>,
  react: string,
  numberShown: number,
  voteProps: VotingProps<VoteableTypeClient>,
  quote: QuoteLocator|null,
  commentBodyRef?: React.RefObject<ContentItemBody>|null,
  classes: ClassesType<typeof styles>,
}) => {
  const { hover, eventHandlers: {onMouseOver, onMouseLeave} } = useHover();
  const { ReactionIcon, LWPopper } = Components;
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
  
  function handleMouseLeave (ev: React.MouseEvent) {
    setHoveredReaction?.({reactionName: react, isHovered: false, quote: null});
    onMouseLeave(ev);
  }

  return <span onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
    <span
      className={classNames(
        classes.footerReaction,
        {
          [classes.footerSelected]: currentUserReactionVote==="created"||currentUserReactionVote==="seconded",
          [classes.footerSelectedAnti]: currentUserReactionVote==="disagreed",
          [classes.hasQuotes]: quotesWithUndefinedRemoved.length > 0,
        }
      )}
    >
      <span onMouseDown={()=>{reactionClicked(react)}}>
        <ReactionIcon react={react} />
      </span>
      <span className={classes.reactionCount}>
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
            react={react} voteProps={voteProps} classes={classes}
            commentBodyRef={commentBodyRef}
          />
        </Card>
      </LWPopper>}
    </span>
    
    {/* Put a spacer element between footer reactions, rather than a margin, so
      * that we can make the spacer element hoverable, getting rid of the
      * close-and-open flash as you move the mouse horizontally across the
      * reactions row.
      */}
    <span className={classes.footerReactionSpacer}/>
  </span>
}

const ReactionOverview = ({voteProps, classes}: {
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType<typeof styles>
}) => {
  const { getCurrentUserReactionVote, setCurrentUserReaction, getAlreadyUsedReactTypesByKarma, getAlreadyUsedReacts } = useNamesAttachedReactionsVoting(voteProps);
  const { Row, LWTooltip, ReactionIcon, ReactionDescription } = Components;

  const alreadyUsedReactionTypesByKarma = getAlreadyUsedReactTypesByKarma();
  const alreadyUsedReactions = getAlreadyUsedReacts();
  
  return <Card>
    <div className={classes.reactOverview}>
      <h3>Reacts Overview</h3>
      <div className={classes.alreadyUsedReactions}>
        {alreadyUsedReactionTypesByKarma.map(r => {
          const reactions = alreadyUsedReactions[r]!;
          const netReactionCount = sumBy(reactions, r=>r.reactType==="disagreed"?-1:1);
          const reactionDetails = getNamesAttachedReactionsByName(r)
          return <div key={`${r}`} className={classes.overviewSummaryRow}>
            <Row justifyContent="flex-start">
              <LWTooltip title={<>{
                reactionDetails.label}{" – "}<ReactionDescription reaction={reactionDetails}/>
              </>}>
                <ReactionIcon react={r}/>
              </LWTooltip>
              <Components.ReactOrAntireactVote
                reactionName={r}
                quote={null}
                netReactionCount={netReactionCount}
                currentUserReaction={getCurrentUserReactionVote(r, null)}
                setCurrentUserReaction={setCurrentUserReaction}
              />
              <Components.UsersWhoReacted reactions={reactions}/>
            </Row>
          </div>
        })}
      </div>
  </div>
  </Card>
}

const NamesAttachedReactionsHoverSingleReaction = ({react, voteProps, classes, commentBodyRef}: {
  react: EmojiReactName,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType<typeof styles>,
  commentBodyRef?: React.RefObject<ContentItemBody>|null
}) => {
  const { ReactionHoverTopRow, ReactionQuotesHoverInfo } = Components;
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

export const AddReactionButton = ({voteProps, classes}: {
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType<typeof styles>
}) => {
  const [open,setOpen] = useState(false);
  const buttonRef = useRef<HTMLElement|null>(null);
  const { PopperCard, LWClickAwayListener, LWTooltip, ReactionsPalette } = Components;
  const { captureEvent } = useTracking();

  const { getCurrentUserReactionVote, toggleReaction } = useNamesAttachedReactionsVoting(voteProps);

  const handleToggleReaction = (name: string, quote: string) => {
    setOpen(false)
    toggleReaction(name, quote)
  }

  return <LWTooltip
    disabled={open}
    inlineBlock={false}
    title={<>Click to react to this comment</>}
  >
    <span
      ref={buttonRef}
      onClick={ev => {
        setOpen(true)
        !open && captureEvent("reactPaletteStateChanged", {open: true})
      }}
      className={classNames(classes.addReactionButton, "react-hover-style")}
    >
      <AddReactionIcon />
      <PopperCard
        open={open} anchorEl={buttonRef.current}
        placement="bottom-end"
        allowOverflow={true}
      >
        <LWClickAwayListener onClickAway={() => {
          setOpen(false)
          captureEvent("reactPaletteStateChanged", {open: false})
        }}>
          <div className={classes.hoverBallot}>
            <ReactionsPalette
              quote={null}
              getCurrentUserReactionVote={getCurrentUserReactionVote}
              toggleReaction={handleToggleReaction}
            />
          </div>
        </LWClickAwayListener>
      </PopperCard>
    </span>
  </LWTooltip>
}

const ReactionOverviewButton = ({voteProps, classes}: {
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType<typeof styles>
}) => {
  const { LWTooltip } = Components;

  return <LWTooltip
    inlineBlock={false}
    clickable={true}
    tooltip={false}
    title={<ReactionOverview voteProps={voteProps} classes={classes}/>}
  >
    <FormatListBulletedIcon className={classes.overviewButton}/>
  </LWTooltip>
}

const NamesAttachedReactionsVoteOnCommentComponent = registerComponent('NamesAttachedReactionsVoteOnComment', NamesAttachedReactionsVoteOnComment, {
  styles,
  hocs: [withErrorBoundary]
});

const NamesAttachedReactionsCommentBottomComponent = registerComponent('NamesAttachedReactionsCommentBottom', NamesAttachedReactionsCommentBottom, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    NamesAttachedReactionsVoteOnComment: typeof NamesAttachedReactionsVoteOnCommentComponent
    NamesAttachedReactionsCommentBottom: typeof NamesAttachedReactionsCommentBottomComponent
  }
}

