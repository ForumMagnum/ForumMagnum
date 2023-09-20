import React, { useState, useRef, RefObject, useEffect, useContext } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { CommentVotingComponentProps, NamesAttachedReactionsCommentBottomProps, } from '../../../lib/voting/votingSystems';
import { NamesAttachedReactionsList, NamesAttachedReactionsVote, NamesAttachedReactionsScore, EmojiReactName, UserReactInfo, UserVoteOnSingleReaction, VoteOnReactionType, reactionsListToDisplayedNumbers } from '../../../lib/voting/namesAttachedReactions';
import { getNamesAttachedReactionsByName } from '../../../lib/voting/reactions';
import type { VotingProps } from '../votingProps';
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
import { dimHighlightClassName, highlightSelectorClassName, faintHighlightClassName } from '../../comments/CommentsItem/CommentsItem';
import without from 'lodash/without';
import { AddReactionIcon } from '../../icons/AddReactionIcon';
import difference from 'lodash/difference';
import uniq from 'lodash/uniq';
import { useTracking } from "../../../lib/analyticsEvents";
import { getConfirmedCoauthorIds } from '../../../lib/collections/posts/helpers';
import type { ContentItemBody } from '../../common/ContentItemBody';
import { HoveredReactionContext } from './HoveredReactionContextProvider';

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
  document, hideKarma=false, commentBodyRef, classes, voteProps, post
}: NamesAttachedReactionsCommentBottomProps & WithStylesProps) => {
  const anchorEl = useRef<HTMLElement|null>(null);
  const currentUser = useCurrentUser();

  const { getAlreadyUsedReactTypesByKarma, getAllReactionQuotes } = useNamesAttachedReactionsVoting(voteProps)

  const extendedScore = voteProps.document?.extendedScore as NamesAttachedReactionsScore|undefined;
  const allReactions = getAlreadyUsedReactTypesByKarma();

  const visibleReactionsDisplay = reactionsListToDisplayedNumbers(extendedScore?.reacts ?? null, currentUser?._id);
  
  const visibleReacts = visibleReactionsDisplay.map(r => r.react)
  const hiddenReacts = difference(allReactions, visibleReacts)

  const quotes = getAllReactionQuotes()

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
            numberShown={numberShown}
            voteProps={voteProps}
            classes={classes}
            commentBodyRef={commentBodyRef}
          />
        </span>
      )}
      {hideKarma && <AddReactionIcon />}
    </span>}
    {hiddenReacts.length > 0 && <ReactionOverviewButton voteProps={voteProps} classes={classes}/>}
    {showReactButton && <AddReactionButton voteProps={voteProps} classes={classes}/>}
  </span>
}

const HoverableReactionIcon = ({reactionRowRef, react, numberShown, voteProps, classes, quote, commentBodyRef}: {
  // reactionRowRef: Reference to the row of reactions, used as an anchor for the
  // hover instead of the individual icon, so that the hover's position stays
  // consistent as you move the mouse across the row.
  reactionRowRef: RefObject<HTMLElement|null>,
  react: string,
  numberShown: number,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType,
  quote?: string, // the quote that will be assigned to newly created reaction
  commentBodyRef?: React.RefObject<ContentItemBody>|null
}) => {
  const { hover, eventHandlers: {onMouseOver, onMouseLeave} } = useHover();
  const { ReactionIcon, LWPopper } = Components;
  const { getCurrentUserReaction, getCurrentUserReactionVote, toggleReaction } = useNamesAttachedReactionsVoting(voteProps);
  const currentUserReactionVote = getCurrentUserReactionVote(react);
  const currentUserReaction = getCurrentUserReaction(react)
  const hoveredReactionContext = useContext(HoveredReactionContext);

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
    hoveredReactionContext?.setReactionIsHovered(react, true);
    onMouseOver(e);
  }
  
  function handleMouseLeave () {
    hoveredReactionContext?.setReactionIsHovered(react, false);
    onMouseLeave();
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
              <Components.ReactOrAntireactVote
                reactionName={r}
                netReactionCount={sumBy(usersWhoReacted, r=>r.reactType==="disagreed"?-1:1)}
                currentUserReaction={getCurrentUserReactionVote(r)}
                setCurrentUserReaction={setCurrentUserReaction}
              />
              <Components.UsersWhoReacted usersWhoReacted={usersWhoReacted}/>
            </Row>
          </div>
        })}
      </div>
  </div>
  </Card>
}

const NamesAttachedReactionsHoverSingleReaction = ({react, voteProps, classes, commentBodyRef}: {
  react: string,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType,
  commentBodyRef?: React.RefObject<ContentItemBody>|null
}) => {
  const extendedScore = voteProps.document?.extendedScore as NamesAttachedReactionsScore|undefined;

  const alreadyUsedReactions: NamesAttachedReactionsList = extendedScore?.reacts ?? {};

  return <div className={classes.footerReactionHover}>
    <Components.HoverBallotReactionRow
      key={react}
      reactionName={react}
      usersWhoReacted={alreadyUsedReactions[react]!}
      voteProps={voteProps}
      commentBodyRef={commentBodyRef}
    />
  </div>
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

