import React, { useState, useRef, RefObject, useEffect } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { CommentVotingComponentProps, } from '../../../lib/voting/votingSystems';
import { NamesAttachedReactionsList, NamesAttachedReactionsVote, NamesAttachedReactionsScore, EmojiReactName, UserReactInfo, UserVoteOnSingleReaction, VoteOnReactionType, reactionsListToDisplayedNumbers } from '../../../lib/voting/namesAttachedReactions';
import { getNamesAttachedReactionsByName } from '../../../lib/voting/reactions';
import type { VotingProps } from '../withVote';
import classNames from 'classnames';
import { useCurrentUser } from '../../common/withUser';
import { useVote } from '../withVote';
import { useHover } from '../../common/withHover';
import { useDialog } from '../../common/withDialog';
import UpArrowIcon from '@material-ui/icons/KeyboardArrowUp';
import withErrorBoundary from '../../common/withErrorBoundary';
import filter from 'lodash/filter';
import orderBy from 'lodash/orderBy';
import sumBy from 'lodash/sumBy';
import Card from '@material-ui/core/Card'
import FormatListBulletedIcon from "@material-ui/icons/FormatListBulleted"
import Mark from 'mark.js';
import { dimHighlightClassName, highlightSelectorClassName, faintHighlightClassName } from '../../comments/CommentsItem/CommentsItem';
import without from 'lodash/without';
import { AddReactionIcon } from '../../icons/AddReactionIcon';
import difference from 'lodash/difference';
import uniq from 'lodash/uniq';
import { useTracking } from "../../../lib/analyticsEvents";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
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
    // background: theme.palette.panelBackground.translucent2,
    marginRight: 6,
  },
  footerReactionsRow: {
    display: "flex",
    alignItems: "center",
  },
  footerReaction: {
    height: 26,
    display: "inline-block",
    borderRadius: 8,
    paddingTop: 2,
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
  reactOrAntireact: {
    width: 55
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
  hoverBallotEntry: {
    fontFamily: theme.typography.commentStyle.fontFamily,
    cursor: "pointer",
    paddingTop: 16,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 8,
    "&:hover": {
      background: theme.palette.panelBackground.darken04,
    },
    
    display: "flex",
    alignItems: "flex-start",
  },
  hoverInfo: {
    paddingLeft: 10,
    maxWidth: 195,
    flexGrow: 1,
  },
  hoverBallotLabel: {
    verticalAlign: "middle",
    display: "inline-block",
    minWidth: 80,
    marginBottom: 4
  },
  hoverBallotReactDescription: {
    fontSize: 11,
    marginBottom: 8
  },
  alreadyUsedReactions: {
    padding: 8
  },

  reactionVoteCount: {
    display: "inline-block",
    verticalAlign: "middle",
  },
  voteArrow: {
    color: theme.palette.grey[400],
  },
  voteArrowIcon: {
    fontSize: 'inherit',
    padding: 0,
    width: 24,
    height: 24,
    verticalAlign: "middle",
  },
  voteArrowLeft: {
    transform: 'rotate(-90deg)',
    marginRight: -4,
  },
  voteArrowRight: {
    transform: 'rotate(-270deg)',
    marginLeft: -4,
  },
  overviewSummaryRow: {
    paddingBottom: 2
  },
  usersWhoReactedRoot: {
    maxWidth: 225,
    display: "inline-block",
    color: theme.palette.grey[600]
  },
  userWhoAntiReacted: {
    color: theme.palette.error.main,
    opacity: .6
  },
  usersWhoReacted: {
    fontSize: 12,
  },
  usersWhoReactedWrap: {
    whiteSpace: "unset",
  },
  footerSelected: {
    background: theme.palette.panelBackground.darken10,
  },
  footerSelectedAnti: {
    background: "rgb(255, 189, 189, .23)",
  },
  overviewButton: {
    opacity: .35,
    marginTop: 2,
    marginRight: 8,
    cursor: "pointer",
    height: 18,
    width: 18
  },
  userWhoReacted: {
    marginRight: 6
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

export function markHighlights (quotes: string[], highlightClassName: string, commentItemRef?: React.RefObject<HTMLDivElement>|null) {
  const ref = commentItemRef?.current
  if (!ref) return
  let markInstance = new Mark(ref);
  markInstance.unmark({className: highlightClassName});
  quotes.forEach(quote => {
    const newQuote = (quote ?? "").trim()
    markInstance.mark(newQuote ?? "", {
      separateWordSearch: false,
      acrossElements: true,
      className: highlightClassName,
    });
  })
}

export function clearHighlights (commentItemRef?: React.RefObject<HTMLDivElement>|null) {
  const ref = commentItemRef?.current
  if (!ref) return
  let markInstance = new Mark(ref);
  markInstance.unmark({className: highlightSelectorClassName});
  markInstance.unmark({className: dimHighlightClassName});
  markInstance.unmark({className: faintHighlightClassName});
}

export const useNamesAttachedReactionsVoting = (voteProps: VotingProps<VoteableTypeClient>): {
  currentUserExtendedVote: NamesAttachedReactionsVote|null,
  getCurrentUserReaction: (name: string) => UserVoteOnSingleReaction|null,
  getCurrentUserReactionVote: (name: string) => VoteOnReactionType|null,
  toggleReaction: (name: string, quote?: string) => void
  setCurrentUserReaction: (name: string, reaction: VoteOnReactionType|null, quote?: string) => void,
  getAlreadyUsedReactTypesByKarma: () => string[],
  getAlreadyUsedReacts: () => NamesAttachedReactionsList,
  getAllReactionQuotes: () => string[]
}=> {
  const { openDialog } = useDialog()
  const currentUser = useCurrentUser()
  const currentUserExtendedVote = (voteProps.document?.currentUserExtendedVote as NamesAttachedReactionsVote|undefined) ?? null;

  function getCurrentUserReaction(name: string): UserVoteOnSingleReaction|null {
    const reacts = currentUserExtendedVote?.reacts ?? [];
    const relevantVoteIndex = reacts.findIndex(r=>r.react===name);
    if (relevantVoteIndex < 0) return null;
    return reacts[relevantVoteIndex];
  }

  function getCurrentUserReactionVote(name: string): VoteOnReactionType|null {
    const currentUserReaction = getCurrentUserReaction(name);
    return currentUserReaction ? currentUserReaction.vote : null
  }

  function openLoginDialog() {
    openDialog({
      componentName: "LoginPopup",
      componentProps: {}
    })
  }

  function toggleReaction(name: string, quote?: string) {
    if (!currentUser) {
      openLoginDialog();
      return;
    }
    const currentUserReaction = getCurrentUserReaction(name);
    const shouldClearUserReaction = getCurrentUserReactionVote(name) && (!quote || currentUserReaction?.quotes?.includes(quote))

    if (shouldClearUserReaction) {
      if (quote && currentUserReaction) {
        clearQuoteFromCurrentUserReaction(currentUserReaction, quote);
      } else {
        clearCurrentUserReaction(name);
      }
    } else {
      const initialVote = "created"; //TODO: "created" vs "seconded"
      addCurrentUserReaction(name, initialVote, quote);
    }
  }
  
  function addCurrentUserReaction(reactionName: string, vote: VoteOnReactionType, quote?: string) {
    if (!currentUser) {
      openLoginDialog();
      return;
    }
    const oldReacts = currentUserExtendedVote?.reacts ?? [];
    const oldQuotes = getCurrentUserReaction(reactionName)?.quotes ?? [];
    const newQuotes = quote ? [...oldQuotes, quote] : oldQuotes
    const newReacts: UserVoteOnSingleReaction[] = [
      ...filter(oldReacts, r=>r.react!==reactionName),
      {
        react: reactionName,
        vote,
        quotes: newQuotes
      }
    ]
    const newExtendedVote: NamesAttachedReactionsVote = {
      ...currentUserExtendedVote,
      reacts: newReacts
    };


    voteProps.vote({
      document: voteProps.document,
      voteType: voteProps.document.currentUserVote || null,
      extendedVote: newExtendedVote,
      currentUser,
    });
  }
  
  function clearCurrentUserReaction(reactionName: string) {
    if (!currentUser) {
      openLoginDialog();
      return;
    }
    
    const oldReacts = currentUserExtendedVote?.reacts ?? [];
    const newExtendedVote: NamesAttachedReactionsVote = {
      ...currentUserExtendedVote,
      reacts: filter(oldReacts, r=>r.react!==reactionName)
    };

    voteProps.vote({
      document: voteProps.document,
      voteType: voteProps.document.currentUserVote || null,
      extendedVote: newExtendedVote,
      currentUser,
    });
  }

  function clearQuoteFromCurrentUserReaction(reaction: UserVoteOnSingleReaction, quote: string) {
    if (!currentUser) {
      openLoginDialog();
      return;
    }

    const oldReacts = currentUserExtendedVote?.reacts ?? [];
    const oldQuotes = reaction.quotes ?? [];
    const newQuotes = without(oldQuotes, quote)

    if (newQuotes.length > 0) {
      const newReacts: UserVoteOnSingleReaction[] = [
        ...filter(oldReacts, r=>r.react!==reaction.react),
        {
          react: reaction.react,
          vote: reaction.vote,
          quotes: newQuotes
        }
      ]

      const newExtendedVote: NamesAttachedReactionsVote = {
        ...currentUserExtendedVote,
        reacts: newReacts
      };

      voteProps.vote({
        document: voteProps.document,
        voteType: voteProps.document.currentUserVote || null,
        extendedVote: newExtendedVote,
        currentUser,
      });
    } else {
      clearCurrentUserReaction(reaction.react)
    }
  }
  
  function setCurrentUserReaction(reactionName: string, reaction: VoteOnReactionType|null, quote?: string) {
    if (reaction) {
      addCurrentUserReaction(reactionName, reaction, quote);
    } else {  
      clearCurrentUserReaction(reactionName);
    }
  }

  function getAlreadyUsedReacts() {
    const extendedScore = voteProps.document?.extendedScore as NamesAttachedReactionsScore|undefined;
    const alreadyUsedReactions: NamesAttachedReactionsList = extendedScore?.reacts ?? {};
    return alreadyUsedReactions
  }

  function getAlreadyUsedReactTypesByKarma() {
    const alreadyUsedReactions = getAlreadyUsedReacts()
    const alreadyUsedReactionTypes: string[] = Object.keys(alreadyUsedReactions);
    const alreadyUsedReactionTypesByKarma = orderBy(alreadyUsedReactionTypes,
      r=> (alreadyUsedReactions[r]!.length>0) ? alreadyUsedReactions[r]![0].karma : 0
    );
    return alreadyUsedReactionTypesByKarma
  }

  function getAllReactionQuotes() {
    const alreadyUsedReactions = getAlreadyUsedReacts()
    const allReacts = Object.values(alreadyUsedReactions)
    const allQuotes = allReacts.flatMap(r => r?.flatMap(r => r?.quotes ?? [])).filter(q => q !== undefined) as string[]
    return uniq(allQuotes)
  }

  return {
    currentUserExtendedVote, getCurrentUserReaction, getCurrentUserReactionVote, toggleReaction, setCurrentUserReaction, getAlreadyUsedReactTypesByKarma, getAlreadyUsedReacts, getAllReactionQuotes
  };
}

const NamesAttachedReactionsVoteOnComment = ({document, hideKarma=false, collection, votingSystem, classes}: CommentVotingComponentProps & WithStylesProps) => {
  const voteProps = useVote(document, collection.options.collectionName, votingSystem);
  const { OverallVoteAxis, AgreementVoteAxis } = Components;
  
  return <span className={classes.root}>
    <OverallVoteAxis
      document={document}
      hideKarma={hideKarma}
      voteProps={voteProps}
      showBox={true}
    />
    <AgreementVoteAxis
      document={document}
      hideKarma={hideKarma}
      voteProps={voteProps}
    />
  </span>
}

const NamesAttachedReactionsCommentBottom = ({
  document, hideKarma=false, collection, votingSystem, commentItemRef, classes, quote
}: CommentVotingComponentProps & WithStylesProps) => {
  const voteProps = useVote(document, collection.options.collectionName, votingSystem);
  const anchorEl = useRef<HTMLElement|null>(null);
  const currentUser = useCurrentUser();

  const { getAlreadyUsedReactTypesByKarma, getAllReactionQuotes } = useNamesAttachedReactionsVoting(voteProps)

  const extendedScore = voteProps.document?.extendedScore as NamesAttachedReactionsScore|undefined;
  const allReactions = getAlreadyUsedReactTypesByKarma();

  const visibleReactionsDisplay = reactionsListToDisplayedNumbers(extendedScore?.reacts ?? null, currentUser?._id);
  
  const visibleReacts = visibleReactionsDisplay.map(r => r.react)
  const hiddenReacts = difference(allReactions, visibleReacts)

  const quotes = getAllReactionQuotes()
  markHighlights(quotes, faintHighlightClassName, commentItemRef)

  useEffect(() => {
    commentItemRef &&  markHighlights(quotes, faintHighlightClassName, commentItemRef)
  }, [quotes, commentItemRef])
  
  return <span className={classes.footerReactionsRow} ref={anchorEl}>
    {visibleReactionsDisplay.length > 0 && <span className={classes.footerReactions}>
      {visibleReactionsDisplay.map(({react, numberShown}) =>
        <span key={react} onMouseLeave={() => markHighlights(quotes, faintHighlightClassName, commentItemRef)}>
          <HoverableReactionIcon
            reactionRowRef={anchorEl}
            react={react}
            numberShown={numberShown}
            voteProps={voteProps}
            classes={classes}
            commentItemRef={commentItemRef}
          />
        </span>
      )}
      {hideKarma && <AddReactionIcon />}
    </span>}
    {hiddenReacts.length > 0 && <ReactionOverviewButton voteProps={voteProps} classes={classes}/>}
    <AddReactionButton voteProps={voteProps} classes={classes}/>
  </span>
}

const HoverableReactionIcon = ({reactionRowRef, react, numberShown, voteProps, classes, quote, commentItemRef}: {
  // reactionRowRef: Reference to the row of reactions, used as an anchor for the
  // hover instead of the individual icon, so that the hover's position stays
  // consistent as you move the mouse across the row.
  reactionRowRef: RefObject<AnyBecauseTodo>,
  react: string,
  numberShown: number,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType,
  quote?: string, // the quote that will be assigned to newly created reaction
  commentItemRef?: React.RefObject<HTMLDivElement>|null
}) => {
  const { hover, eventHandlers: {onMouseOver, onMouseLeave} } = useHover();
  const { ReactionIcon, LWPopper } = Components;
  const { getCurrentUserReaction, getCurrentUserReactionVote, toggleReaction } = useNamesAttachedReactionsVoting(voteProps);
  const currentUserReactionVote = getCurrentUserReactionVote(react);
  const currentUserReaction = getCurrentUserReaction(react)

  const extendedScore = voteProps.document?.extendedScore as NamesAttachedReactionsScore|undefined;
  const alreadyUsedReactions: NamesAttachedReactionsList = extendedScore?.reacts ?? {}
  const reactions: UserReactInfo[] = alreadyUsedReactions[react] ?? []
  const quotes = reactions.flatMap(r => r.quotes)
  const quotesWithUndefinedRemoved = filter(quotes, q => q !== undefined) as string[]

  function reactionClicked(reaction: EmojiReactName) {
    if (currentUserReaction?.quotes?.length) return
    toggleReaction(reaction, quote);
  }

  function handleMouseEnter (e: any) {
    onMouseOver(e);
    clearHighlights(commentItemRef)
    markHighlights(quotesWithUndefinedRemoved, highlightSelectorClassName, commentItemRef)
  }
  
  function handleMouseLeave () {
    onMouseLeave();
    clearHighlights(commentItemRef)
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
            commentItemRef={commentItemRef}
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
  classes: ClassesType
}) => {
  const { getCurrentUserReactionVote, setCurrentUserReaction, getAlreadyUsedReactTypesByKarma, getAlreadyUsedReacts } = useNamesAttachedReactionsVoting(voteProps);
  const { Row, LWTooltip, ReactionIcon } = Components;

  const alreadyUsedReactionTypesByKarma = getAlreadyUsedReactTypesByKarma();
  const alreadyUsedReactions = getAlreadyUsedReacts();
  
  return <Card>
    <div className={classes.reactOverview}>
      <h3>Reacts Overview</h3>
      <div className={classes.alreadyUsedReactions}>
        {alreadyUsedReactionTypesByKarma.map(r => {
          const usersWhoReacted = alreadyUsedReactions[r]!;
          const { description, label } = getNamesAttachedReactionsByName(r)
          return <div key={`${r}`} className={classes.overviewSummaryRow}>
            <Row justifyContent="flex-start">
              <LWTooltip title={`${label} – ${description}`}>
                <ReactionIcon react={r}/>
              </LWTooltip>                
              <ReactOrAntireactVote
                reactionName={r}
                netReactionCount={sumBy(usersWhoReacted, r=>r.reactType==="disagreed"?-1:1)}
                currentUserReaction={getCurrentUserReactionVote(r)}
                setCurrentUserReaction={setCurrentUserReaction}
                classes={classes}
              />
              <UsersWhoReacted usersWhoReacted={usersWhoReacted} classes={classes}/>
            </Row>
          </div>
        })}
      </div>
  </div>
  </Card>
}

const NamesAttachedReactionsHoverSingleReaction = ({react, voteProps, classes, commentItemRef}: {
  react: string,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType,
  commentItemRef?: React.RefObject<HTMLDivElement>|null
}) => {
  const extendedScore = voteProps.document?.extendedScore as NamesAttachedReactionsScore|undefined;

  const alreadyUsedReactions: NamesAttachedReactionsList = extendedScore?.reacts ?? {};

  return <div className={classes.footerReactionHover}>
    <HoverBallotReactionRow
      key={react}
      reactionName={react}
      usersWhoReacted={alreadyUsedReactions[react]!}
      voteProps={voteProps}
      classes={classes}
      commentItemRef={commentItemRef}
    />
  </div>
}

const UsersWhoReacted = ({usersWhoReacted, wrap=false, showTooltip=true, classes}:{
  usersWhoReacted:UserReactInfo[], 
  wrap?: boolean, 
  showTooltip?: boolean, 
  classes:ClassesType,
}) => {
  const { LWTooltip } = Components;
  const usersWhoReactedWithoutQuotes = usersWhoReacted.filter(r => !r.quotes || r.quotes.length === 0)

  if (usersWhoReactedWithoutQuotes.length === 0) return null;

  const usersWhoProReacted = usersWhoReactedWithoutQuotes.filter(r=>r.reactType!=="disagreed")
  const usersWhoAntiReacted = usersWhoReactedWithoutQuotes.filter(r=>r.reactType==="disagreed")

  const tooltip = <div>
    <p>Users Who Reacted:</p>
    <ul>{usersWhoProReacted.map(r => <li key={r.userId}>{r.displayName}</li>)}</ul>
    {usersWhoAntiReacted.length > 0 && <>
      <p>Users Who Anti-reacted:</p>
      <ul>{usersWhoAntiReacted.map(r => <li key={r.userId}>{r.displayName}</li>)}</ul>
    </>}
  </div>

  const component = <div className={classes.usersWhoReactedRoot}>
      {usersWhoProReacted.length > 0 &&
        <div className={classNames(classes.usersWhoReacted, {[classes.usersWhoReactedWrap]: wrap})}>
          {usersWhoProReacted.map((userReactInfo,i) =>
            <span key={userReactInfo.userId} className={classes.userWhoReacted}>
              {(i>0) && <span>{", "}</span>}
              {userReactInfo.displayName}
            </span>
          )}
        </div>
      }
      {usersWhoAntiReacted.length > 0 &&
        <div className={classNames(classes.usersWhoReacted, {[classes.usersWhoReactedWrap]: wrap})}>
          {usersWhoAntiReacted.map((userReactInfo,i) =>
            <span key={userReactInfo.userId} className={classNames(classes.userWhoReacted, classes.userWhoAntiReacted)}>
              {(i>0) && <span>{", "}</span>}
              {userReactInfo.displayName}
            </span>
          )}
        </div>
      }
  </div>

  if (showTooltip) {
    return <LWTooltip title={tooltip}>
      {component}
    </LWTooltip>
  } else {
    return component
  }
}

const HoverBallotReactionRow = ({reactionName, usersWhoReacted, classes, commentItemRef, voteProps}: {
  reactionName: string,
  usersWhoReacted: UserReactInfo[],
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType,
  commentItemRef?: React.RefObject<HTMLDivElement>|null
}) => {
  const { ReactionIcon, ReactionQuotesHoverInfo } = Components;
  const netReactionCount = sumBy(usersWhoReacted, r=>r.reactType==="disagreed"?-1:1);
  const { getCurrentUserReactionVote, setCurrentUserReaction } = useNamesAttachedReactionsVoting(voteProps);

  return <div key={reactionName}>
    <div className={classes.hoverBallotEntry}>
      <ReactionIcon react={reactionName} size={30}/>
      <div className={classes.hoverInfo}>
        <span className={classes.hoverBallotLabel}>
          {getNamesAttachedReactionsByName(reactionName).label}
        </span>
        {getNamesAttachedReactionsByName(reactionName).description && <div className={classes.hoverBallotReactDescription}>
          {getNamesAttachedReactionsByName(reactionName).description}
        </div>}
        <UsersWhoReacted usersWhoReacted={usersWhoReacted} classes={classes} wrap showTooltip={false}/>

      </div>
      <ReactOrAntireactVote
        reactionName={reactionName}
        netReactionCount={netReactionCount}
        currentUserReaction={getCurrentUserReactionVote(reactionName)}
        setCurrentUserReaction={setCurrentUserReaction}
        classes={classes}
      />
    </div>
    <ReactionQuotesHoverInfo react={reactionName} voteProps={voteProps} commentItemRef={commentItemRef}/>
  </div>
}

const ReactOrAntireactVote = ({reactionName, netReactionCount, currentUserReaction, setCurrentUserReaction, classes}: {
  reactionName: string
  netReactionCount: number
  currentUserReaction: VoteOnReactionType|null
  setCurrentUserReaction: (reactionName: string, reaction: VoteOnReactionType|null)=>void
  classes: ClassesType
}) => {
  const onClick = (reaction: "reacted"|"disagreed") => {
    if (reaction === "reacted") {
      if (currentUserReaction === "created" || currentUserReaction === "seconded") {
        setCurrentUserReaction(reactionName, null);
      } else {
        setCurrentUserReaction(reactionName, "seconded");
      }
    } else {
      if (currentUserReaction === "disagreed") {
        setCurrentUserReaction(reactionName, null);
      } else {
        setCurrentUserReaction(reactionName, "disagreed");
      }
    }
  }

  return <div className={classes.reactOrAntireact}>
    <ReactionVoteArrow
      orientation="left"
      onClick={() => onClick("disagreed")}
      classes={classes}
      color={currentUserReaction==="disagreed" ? "error" : "inherit"}
    />
    <span className={classes.reactionVoteCount}>
      {netReactionCount}
    </span>
    <ReactionVoteArrow
      orientation="right"
      onClick={() => onClick("reacted")}
      classes={classes}
      color={(currentUserReaction==="created"||currentUserReaction==="seconded") ? "primary" : "inherit"}
    />
  </div>
}

const ReactionVoteArrow = ({orientation, onClick, color, classes}: {
  orientation: "left"|"right",
  onClick: ()=>void,
  color: "inherit"|"primary"|"error",
  classes: ClassesType,
}) => {
  return <span className={classes.voteArrow}>
    <UpArrowIcon
      onClick={onClick}
      color={color}
      className={classNames(
        classes.voteArrowIcon,
        {
          [classes.voteArrowLeft]: orientation==="left",
          [classes.voteArrowRight]: orientation==="right",
        },
      )}
    />
  </span>
}

export const AddReactionButton = ({voteProps, classes}: {
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType
}) => {
  const [open,setOpen] = useState(false);
  const buttonRef = useRef<HTMLElement|null>(null);
  const { PopperCard, LWClickAwayListener, LWTooltip, ReactionsPalette } = Components;
  const { captureEvent } = useTracking();

  const { getCurrentUserReactionVote, toggleReaction, getCurrentUserReaction } = useNamesAttachedReactionsVoting(voteProps);

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
      {open && <LWClickAwayListener onClickAway={() => {
        setOpen(false)
        captureEvent("reactPaletteStateChanged", {open: false})
      }}>
        <PopperCard
          open={open} anchorEl={buttonRef.current}
          placement="bottom-end"
          allowOverflow={true}
          
        >
          <div className={classes.hoverBallot}>
            <ReactionsPalette
              getCurrentUserReaction={getCurrentUserReaction}
              getCurrentUserReactionVote={getCurrentUserReactionVote}
              toggleReaction={handleToggleReaction}
            />
          </div>
        </PopperCard>
      </LWClickAwayListener>}
    </span>
  </LWTooltip>
}

const ReactionOverviewButton = ({voteProps, classes}: {
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType
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

