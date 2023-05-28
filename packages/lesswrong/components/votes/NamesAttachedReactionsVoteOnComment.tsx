import React, { useState, useRef, RefObject, MouseEventHandler } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { CommentVotingComponentProps, } from '../../lib/voting/votingSystems';
import { NamesAttachedReactionsList, NamesAttachedReactionsVote, NamesAttachedReactionsScore, EmojiReactName, UserReactInfo, UserVoteOnSingleReaction, VoteOnReactionType, reactionsListToDisplayedNumbers } from '../../lib/voting/namesAttachedReactions';
import { namesAttachedReactionsByName } from '../../lib/voting/reactions';
import type { VotingProps } from './withVote';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser';
import { useVote } from './withVote';
import { useHover } from '../common/withHover';
import { useDialog } from '../common/withDialog';
import UpArrowIcon from '@material-ui/icons/KeyboardArrowUp';
import InsertEmoticonOutlined from '@material-ui/icons/InsertEmoticon';
import withErrorBoundary from '../common/withErrorBoundary';
import filter from 'lodash/filter';
import orderBy from 'lodash/orderBy';
import sumBy from 'lodash/sumBy';
import { ThickChevronDownIcon } from "../icons/thickChevronDownIcon";
import Card from '@material-ui/core/Card'
import FormatListBulletedIcon from "@material-ui/icons/FormatListBulleted"

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    whiteSpace: "nowrap",
  },
  footerReactions: {
    display: "inline-block",
    fontSize: 25,
    lineHeight: 0.6,
    height: 26,
    outline: theme.palette.border.commentBorder,
    textAlign: 'center',
    whiteSpace: "nowrap",
    zIndex: theme.zIndexes.reactionsFooter,
    overflow: "hidden",    
    background: theme.palette.panelBackground.translucent2,
    borderRadius: 6,
  },
  footerReactionsRow: {
    display: "flex",
    alignItems: "center",
  },
  footerReaction: {
    height: 26,
    display: "inline-block",
    paddingTop: 2,
    paddingLeft: 4,
    paddingRight: 6,
    "&:first-child": {
      paddingLeft: 6,
    },
    "&:last-child": {
      paddingRight: 7,
      marginRight: 0,
    },
    "&:hover": {
      background: theme.palette.panelBackground.darken04,
    },
  },
  footerReactionHover: {
    maxWidth: 300,
  },
  reactionCount: {
    fontSize: 14,
    fontFamily: theme.typography.commentStyle.fontFamily,
    color: theme.palette.text.dim60,
    marginLeft: 3,
    verticalAlign: "middle",
  },
  addReactionButton: {
    verticalAlign: "bottom",
    marginLeft: 11,
    filter: "opacity(0.2)",
    cursor: "pointer",
    "& svg": {
      width: 16,
      height: 16,
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
    paddingBottom: 8,
    paddingLeft: 12,
    paddingRight: 8,
    "&:hover": {
      background: theme.palette.panelBackground.darken04,
    },
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
    fontSize: 11,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
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
  hoverInfo: {
    marginTop: -6,
    paddingLeft: 10,
    maxWidth: 195,
  },
  overviewButton: {
    opacity: .35,
    marginTop: 2,
    marginLeft: 8,
    cursor: "pointer",
    height: 18,
    width: 18
  }
})


export const useNamesAttachedReactionsVoting = (voteProps: VotingProps<VoteableTypeClient>): {
  currentUserExtendedVote: NamesAttachedReactionsVote|null,
  getCurrentUserReactionVote: (name: string) => VoteOnReactionType|null,
  toggleReaction: (name: string, quote?: string) => void
  setCurrentUserReaction: (name: string, reaction: VoteOnReactionType|null, quote?: string) => void,
  getAlreadyUsedReactTypesByKarma: () => string[],
  getAlreadyUsedReacts: () => NamesAttachedReactionsList
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
    
    if (getCurrentUserReactionVote(name)) {
      clearCurrentUserReaction(name);
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
    const newReacts: UserVoteOnSingleReaction[] = [
      ...filter(oldReacts, r=>r.react!==reactionName),
      {
        react: reactionName,
        vote,
        quotes: quote ? [quote] : []
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
  

  return {
    currentUserExtendedVote, getCurrentUserReactionVote, toggleReaction, setCurrentUserReaction, getAlreadyUsedReactTypesByKarma, getAlreadyUsedReacts
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
  document, hideKarma=false, collection, votingSystem, setCommentBodyHighlights, classes, quote
}: CommentVotingComponentProps & WithStylesProps) => {
  const voteProps = useVote(document, collection.options.collectionName, votingSystem);
  const anchorEl = useRef<HTMLElement|null>(null);
  const currentUser = useCurrentUser();

  const extendedScore = document?.extendedScore as NamesAttachedReactionsScore|undefined;
  const reactionsShown = reactionsListToDisplayedNumbers(extendedScore?.reacts ?? null, currentUser?._id);
  const { getAlreadyUsedReactTypesByKarma } = useNamesAttachedReactionsVoting(voteProps)
  const alreadyUsedReactTypesByKarma = getAlreadyUsedReactTypesByKarma();
  const showOverviewButton = alreadyUsedReactTypesByKarma.length > 1 || reactionsShown.length < alreadyUsedReactTypesByKarma.length;
  
  return <span className={classes.footerReactionsRow} ref={anchorEl}>
    {(reactionsShown.length > 0 || showOverviewButton) && <span className={classes.footerReactions} >
      {!hideKarma && reactionsShown.map(({react, numberShown}) =>
        <HoverableReactionIcon
          key={react}
          anchorEl={anchorEl}
          react={react}
          numberShown={numberShown}
          voteProps={voteProps}
          classes={classes}
          setCommentBodyHighlights={setCommentBodyHighlights}
        />
      )}
      {hideKarma && <InsertEmoticonOutlined/>}
    </span>}
    {showOverviewButton && <ReactionOverviewButton voteProps={voteProps} classes={classes}/>}
    <AddReactionButton voteProps={voteProps} classes={classes}/>
  </span>
}

const HoverableReactionIcon = ({anchorEl, react, numberShown, voteProps, classes, quote, setCommentBodyHighlights}: {
  anchorEl: RefObject<AnyBecauseTodo>,
  react: string,
  numberShown: number,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType,
  quote?: string, // the quote that will be assigned to newly created reaction
  setCommentBodyHighlights?: (highlights: string[])=>void
}) => {
  const { hover, eventHandlers: {onMouseOver, onMouseLeave} } = useHover();
  const { ReactionIcon, PopperCard } = Components;
  const { getCurrentUserReactionVote, toggleReaction } = useNamesAttachedReactionsVoting(voteProps);
  const currentUserReactionVote = getCurrentUserReactionVote(react);

  const extendedScore = voteProps.document?.extendedScore as NamesAttachedReactionsScore|undefined;
  const alreadyUsedReactions: NamesAttachedReactionsList = extendedScore?.reacts ?? {}
  const reactions: UserReactInfo[] = alreadyUsedReactions[react] ?? []
  const quotes = reactions.flatMap(r => r.quotes)
  const quotesWithUndefinedRemoved = filter(quotes, q => q !== undefined) as string[]

  function reactionClicked(reaction: EmojiReactName) {
    toggleReaction(reaction, quote);
  }

  function handleMouseOver (e: any) {
    onMouseOver(e);
    setCommentBodyHighlights && setCommentBodyHighlights(quotesWithUndefinedRemoved)
  }
  
  function handleMouseLeave () {
    onMouseLeave();
    setCommentBodyHighlights && setCommentBodyHighlights([])
  } 

  return <span
    className={classNames(
      classes.footerReaction,
      {
        [classes.footerSelected]: currentUserReactionVote==="created"||currentUserReactionVote==="seconded",
        [classes.footerSelectedAnti]: currentUserReactionVote==="disagreed",
      }
    )}
    onMouseOver={handleMouseOver}
    onMouseLeave={handleMouseLeave}
    onMouseDown={()=>{reactionClicked(react)}}
  >
    <ReactionIcon react={react} />
    <span className={classes.reactionCount}>{numberShown}</span>

    {hover && anchorEl?.current && <PopperCard
      open={!!hover} anchorEl={anchorEl.current}
      placement="bottom-end"
      allowOverflow={true}
      
    >
      <NamesAttachedReactionsHoverSingleReaction react={react} voteProps={voteProps} classes={classes}/>
    </PopperCard>}
  </span>
}

const NamesAttachedReactionsHoverBallot = ({voteProps, classes}: {
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType
}) => {
  const { getCurrentUserReactionVote, toggleReaction } = useNamesAttachedReactionsVoting(voteProps);
  const { ReactionsPalette } = Components;

  return <div className={classes.hoverBallot}>
    <ReactionsPalette
      getCurrentUserReactionVote={getCurrentUserReactionVote}
      toggleReaction={toggleReaction}
    />
  </div>
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
          const { description, label } = namesAttachedReactionsByName[r]
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

const NamesAttachedReactionsHoverSingleReaction = ({react, voteProps, classes}: {
  react: string,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType
}) => {
  const extendedScore = voteProps.document?.extendedScore as NamesAttachedReactionsScore|undefined;

  const alreadyUsedReactions: NamesAttachedReactionsList = extendedScore?.reacts ?? {};
  const { getCurrentUserReactionVote, setCurrentUserReaction } = useNamesAttachedReactionsVoting(voteProps);

  const { hover, eventHandlers } = useHover();

  return <div className={classes.footerReactionHover}>
    <HoverBallotReactionRow
      key={react}
      reactionName={react}
      usersWhoReacted={alreadyUsedReactions[react]!}
      getCurrentUserReactionVote={getCurrentUserReactionVote}
      setCurrentUserReaction={setCurrentUserReaction}
      classes={classes}
    />
  </div>
}

const UsersWhoReacted = ({usersWhoReacted, wrap=false, showTooltip=true, classes}:{usersWhoReacted:UserReactInfo[], wrap?: boolean, showTooltip?: boolean, classes:ClassesType}) => {
  const { LWTooltip } = Components;
  const usersWhoProReacted = usersWhoReacted.filter(r=>r.reactType!=="disagreed")
  const usersWhoAntiReacted = usersWhoReacted.filter(r=>r.reactType==="disagreed")
  const tooltip = <div>
    <p>Users Who Reacted:</p>
    <ul>{usersWhoProReacted.map(r => <li key={r.userId}>{r.displayName}</li>)}</ul>
    {usersWhoAntiReacted.length > 0 && <>
      <p>Users Who Anti-reacted:</p>
      <ul>{usersWhoAntiReacted.map(r => <li key={r.userId}>{r.displayName}</li>)}</ul>
    </>}
  </div>

  const component = <div className={classes.usersWhoReactedRoot}>
    <div className={classNames(classes.usersWhoReacted, {[classes.usersWhoReactedWrap]: wrap})}>
      {usersWhoProReacted.map((userReactInfo,i) =>
          <div key={userReactInfo.userId} className={classes.userWhoReacted}>
            {(i>0) && <span>{", "}</span>}
            {userReactInfo.displayName}
            {userReactInfo.quotes?.map(quote => <span key={quote} className={classes.tinyLabel}> {quote}</span>)}
          </div>
        )
      }
    </div>
    {usersWhoAntiReacted.length > 0 &&
      <div className={classNames(classes.usersWhoReacted, {[classes.usersWhoReactedWrap]: wrap})}>
        {usersWhoAntiReacted.map((userReactInfo,i) =>
          <div key={userReactInfo.userId} className={classNames(classes.userWhoReacted, classes.userWhoAntiReacted)}>
            {(i>0) && <span>{", "}</span>}
            {userReactInfo.displayName}
          </div>
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

const HoverBallotReactionRow = ({reactionName, usersWhoReacted, getCurrentUserReactionVote, setCurrentUserReaction, classes}: {
  reactionName: string,
  usersWhoReacted: UserReactInfo[],
  getCurrentUserReactionVote: (name: string) => VoteOnReactionType|null,
  setCurrentUserReaction: (reactionName: string, reaction: VoteOnReactionType|null)=>void
  classes: ClassesType,
}) => {
  const { ReactionIcon, Row } = Components;
  const netReactionCount = sumBy(usersWhoReacted, r=>r.reactType==="disagreed"?-1:1);

  return <div
    key={reactionName}
    className={classes.hoverBallotEntry}
  >
    <Row justifyContent='space-between' alignItems='flex-start'>
      <ReactionIcon react={reactionName} size={24}/>
      <div className={classes.hoverInfo}>
        <span className={classes.hoverBallotLabel}>
          {namesAttachedReactionsByName[reactionName].label}
        </span>
        <div className={classes.hoverBallotReactDescription}>
          {namesAttachedReactionsByName[reactionName].description}
        </div>
        <UsersWhoReacted usersWhoReacted={usersWhoReacted} classes={classes} wrap showTooltip={false}/>
      </div>    
      <ReactOrAntireactVote
        reactionName={reactionName}
        netReactionCount={netReactionCount}
        currentUserReaction={getCurrentUserReactionVote(reactionName)}
        setCurrentUserReaction={setCurrentUserReaction}
        classes={classes}
      />
    </Row>
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
  const { PopperCard, LWClickAwayListener, LWTooltip } = Components;

  return <LWTooltip
    disabled={open}
    inlineBlock={false}
    title={<>Click to react to this comment</>}
  >
    <span
      ref={buttonRef}
      onClick={ev => setOpen(true)}
      className={classes.addReactionButton}
    >
      <InsertEmoticonOutlined/>
  
      {open && <LWClickAwayListener onClickAway={() => setOpen(false)}>
        <PopperCard
          open={open} anchorEl={buttonRef.current}
          placement="bottom-end"
          allowOverflow={true}
          
        >
          <NamesAttachedReactionsHoverBallot voteProps={voteProps} classes={classes}/>
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

