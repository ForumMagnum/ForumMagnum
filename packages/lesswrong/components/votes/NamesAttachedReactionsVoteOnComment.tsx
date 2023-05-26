import React, { useState, useRef, RefObject } from 'react';
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
    // padding: 3
  },
  footerReactions2: {
    display: "inline-block",
    fontSize: 25,
    lineHeight: 0.6,
    height: 26,
    outline: theme.palette.border.commentBorder,
    textAlign: 'center',
    whiteSpace: "nowrap",
    zIndex: theme.zIndexes.reactionsFooter,
    background: theme.palette.panelBackground.translucent2,
    borderRadius: 6,
    marginLeft: 8
  },
  footerReactionsRow: {
    display: "flex",
    alignItems: "center",
  },
  footerReactionsRow2: {
    display: "flex",
    alignItems: "center",
    marginLeft: -10,
    marginTop: 6,
    marginBottom: 6
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
    width: 300,
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
    marginLeft: 12,
    width: 55
  },
  hoverBallot: {
    fontFamily: theme.typography.commentStyle.fontFamily,
    paddingTop: 12,
    maxWidth: 350,
  },
  hoverBallotEntry: {
    fontFamily: theme.typography.commentStyle.fontFamily,
    cursor: "pointer",
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 16,
    paddingRight: 16,
    "&:hover": {
      background: theme.palette.panelBackground.darken04,
    },
  },
  hoverBallotLabel: {
    verticalAlign: "middle",
    marginLeft: 6,
    display: "inline-block",
    minWidth: 80,
  },
  hoverBallotReactDescription: {
    marginLeft: 25,
    marginBottom: 6,
    fontSize: 11,
  },
  alreadyUsedReactions: {
    // marginBottom: 8,
    padding: 8,
    borderTop: theme.palette.border.faint
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
  paletteSummaryRow: {
    paddingLeft: 10,
    paddingBottom: 2
  },
  usersWhoReactedRoot: {
    maxWidth: 225,
    display: "inline-block",
    color: theme.palette.grey[600]
  },
  antiReacted: {
    color: theme.palette.error,
    opacity: .6
  },
  usersWhoReacted: {
    fontSize: 11,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  footerSelected: {
    background: theme.palette.panelBackground.darken10,
  },
  footerSelectedAnti: {
    background: "rgb(255, 189, 189, .23)",
  }
})


const useNamesAttachedReactionsVoting = (voteProps: VotingProps<VoteableTypeClient>): {
  currentUserExtendedVote: NamesAttachedReactionsVote|null,
  getCurrentUserReactionVote: (name: string) => VoteOnReactionType|null,
  toggleReaction: (name: string) => void
  setCurrentUserReaction: (name: string, reaction: VoteOnReactionType|null) => void,
}=> {
  const { openDialog } = useDialog()
  const currentUser = useCurrentUser()
  const currentUserExtendedVote = (voteProps.document?.currentUserExtendedVote as NamesAttachedReactionsVote|undefined) ?? null;

  function getCurrentUserReactionVote(name: string): VoteOnReactionType|null {
    const reacts = currentUserExtendedVote?.reacts ?? [];
    const relevantVoteIndex = reacts.findIndex(r=>r.react===name);
    if (relevantVoteIndex < 0) return null;
    return reacts[relevantVoteIndex].vote;
  }

  function openLoginDialog() {
    openDialog({
      componentName: "LoginPopup",
      componentProps: {}
    })
  }

  function toggleReaction(name: string) {
    if (!currentUser) {
      openLoginDialog();
      return;
    }
    
    if (getCurrentUserReactionVote(name)) {
      clearCurrentUserReaction(name);
    } else {
      const initialVote = "created"; //TODO: "created" vs "seconded"
      addCurrentUserReaction(name, initialVote);
    }
  }
  
  function addCurrentUserReaction(reactionName: string, vote: VoteOnReactionType) {
    if (!currentUser) {
      openLoginDialog();
      return;
    }
    
    const oldReacts = currentUserExtendedVote?.reacts ?? [];
    const newReacts: UserVoteOnSingleReaction[] = [
      ...filter(oldReacts, r=>r.react!==reactionName),
      {
        react: reactionName,
        vote: vote,
      }
    ]
    const newExtendedVote: NamesAttachedReactionsVote = {
      ...currentUserExtendedVote,
      reacts: newReacts,
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
  
  function setCurrentUserReaction(reactionName: string, reaction: VoteOnReactionType|null) {
    if (reaction) {
      addCurrentUserReaction(reactionName, reaction);
    } else {  
      clearCurrentUserReaction(reactionName);
    }
  }

  return {
    currentUserExtendedVote, getCurrentUserReactionVote, toggleReaction, setCurrentUserReaction
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
    {/* <NamesAttachedReactionsCommentBottom document={document} hideKarma={false} collection={collection} votingSystem={votingSystem}/> */}
  </span>
}

const NamesAttachedReactionsCommentBottom = ({
  document, hideKarma=false, collection, votingSystem, classes
}: CommentVotingComponentProps & WithStylesProps) => {
  const { OverallVoteAxis, AgreementVoteAxis } = Components
  const voteProps = useVote(document, collection.options.collectionName, votingSystem);
  const anchorEl = useRef<HTMLElement|null>(null);

  const extendedScore = document?.extendedScore as NamesAttachedReactionsScore|undefined;
  const reactionsShown = reactionsListToDisplayedNumbers(extendedScore?.reacts ?? null);
  
  // if (!reactionsShown.length) {
  //   return null;
  // }
  
  return <span className={classes.footerReactionsRow2} ref={anchorEl}>
    {reactionsShown.length > 0 && <span className={classes.footerReactions2} >
      {!hideKarma && reactionsShown.map(({react, numberShown}) =>
        <HoverableReactionIcon
          key={react}
          anchorEl={anchorEl}
          react={react}
          numberShown={numberShown}
          voteProps={voteProps}
          classes={classes}
        />
      )}
      {hideKarma && <InsertEmoticonOutlined/>}
    </span>}
    <AddReactionButton voteProps={voteProps} classes={classes}/>
  </span>
}

const NamesAttachedReactionsCommentBottomOld = ({
  document, hideKarma=false, collection, votingSystem, classes
}: CommentVotingComponentProps & WithStylesProps) => {
  const voteProps = useVote(document, collection.options.collectionName, votingSystem);
  const anchorEl = useRef<HTMLElement|null>(null);
  const currentUser = useCurrentUser();

  const extendedScore = document?.extendedScore as NamesAttachedReactionsScore|undefined;
  const reactionsShown = reactionsListToDisplayedNumbers(extendedScore?.reacts ?? null, currentUser?._id);
  
  // if (!reactionsShown.length) {
  //   return null;
  // }
  
  return <span className={classes.footerReactionsRow} ref={anchorEl}>
    {reactionsShown.length > 0 && <span className={classes.footerReactions} >
      {!hideKarma && reactionsShown.map(({react, numberShown}) =>
        <HoverableReactionIcon
          key={react}
          anchorEl={anchorEl}
          react={react}
          numberShown={numberShown}
          voteProps={voteProps}
          classes={classes}
        />
      )}
      {hideKarma && <InsertEmoticonOutlined/>}
    </span>}
    <AddReactionButton voteProps={voteProps} classes={classes}/>
  </span>
}

const HoverableReactionIcon = ({anchorEl, react, numberShown, voteProps, classes}: {
  anchorEl: RefObject<AnyBecauseTodo>,
  react: string,
  numberShown: number,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType,
}) => {
  const { hover, eventHandlers } = useHover();
  const { ReactionIcon, PopperCard } = Components;
  const { getCurrentUserReactionVote, toggleReaction } = useNamesAttachedReactionsVoting(voteProps);
  const currentUserReactionVote = getCurrentUserReactionVote(react);

  function reactionClicked(reaction: EmojiReactName) {
    toggleReaction(reaction);
  }
  
  return <span
    className={classNames(
      classes.footerReaction,
      {
        [classes.footerSelected]: currentUserReactionVote==="created"||currentUserReactionVote==="seconded",
        [classes.footerSelectedAnti]: currentUserReactionVote==="disagreed",
      }
    )}
    {...eventHandlers}
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
  const currentUser = useCurrentUser()
  const { openDialog } = useDialog()
  const { currentUserExtendedVote, getCurrentUserReactionVote } = useNamesAttachedReactionsVoting(voteProps);
  const { ReactionsPalette, Row, LWTooltip, ReactionIcon } = Components;


  function openLoginDialog() {
    openDialog({
      componentName: "LoginPopup",
      componentProps: {}
    })
  }

  function toggleReaction(name: string) {
    if (!currentUser) {
      openLoginDialog();
      return;
    }
    
    if (getCurrentUserReactionVote(name)) {
      clearCurrentUserReaction(name);
    } else {
      const initialVote = "created"; //TODO: "created" vs "seconded"
      addCurrentUserReaction(name, initialVote);
    }
  }
  
  function addCurrentUserReaction(reactionName: string, vote: VoteOnReactionType) {
    if (!currentUser) {
      openLoginDialog();
      return;
    }
    
    const oldReacts = currentUserExtendedVote?.reacts ?? [];
    const newReacts: UserVoteOnSingleReaction[] = [
      ...filter(oldReacts, r=>r.react!==reactionName),
      {
        react: reactionName,
        vote: vote,
      }
    ]
    const newExtendedVote: NamesAttachedReactionsVote = {
      ...currentUserExtendedVote,
      reacts: newReacts,
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
  
  function setCurrentUserReaction(reactionName: string, reaction: VoteOnReactionType|null) {
    if (reaction) {
      addCurrentUserReaction(reactionName, reaction);
    } else {
      clearCurrentUserReaction(reactionName);
    }
  }
  
  const extendedScore = voteProps.document?.extendedScore as NamesAttachedReactionsScore|undefined;
  const alreadyUsedReactions: NamesAttachedReactionsList = extendedScore?.reacts ?? {};
  const alreadyUsedReactionTypes: string[] = Object.keys(alreadyUsedReactions);
  const alreadyUsedReactionTypesByKarma = orderBy(alreadyUsedReactionTypes,
    r=> (alreadyUsedReactions[r]!.length>0) ? alreadyUsedReactions[r]![0].karma : 0
  );
  
  return <div className={classes.hoverBallot}>
    <ReactionsPalette
      getCurrentUserReactionVote={getCurrentUserReactionVote}
      toggleReaction={toggleReaction}
    />

    {alreadyUsedReactionTypesByKarma.length>0 &&
      <div className={classes.alreadyUsedReactions}>
        {alreadyUsedReactionTypesByKarma.map(r => {
          const usersWhoReacted = alreadyUsedReactions[r]!;
          const { description, label } = namesAttachedReactionsByName[r]
          return <div key={`${r}`} className={classes.paletteSummaryRow}>
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
    }
  </div>
}

const NamesAttachedReactionsHoverSingleReaction = ({react, voteProps, classes}: {
  react: string,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType
}) => {
  const extendedScore = voteProps.document?.extendedScore as NamesAttachedReactionsScore|undefined;
  const alreadyUsedReactions: NamesAttachedReactionsList = extendedScore?.reacts ?? {};
  const { getCurrentUserReactionVote, setCurrentUserReaction } = useNamesAttachedReactionsVoting(voteProps);

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

const UsersWhoReacted = ({usersWhoReacted, classes}:{usersWhoReacted:UserReactInfo[], classes:ClassesType}) => {
  return <div className={classes.usersWhoReactedRoot}>
    <div className={classes.usersWhoReacted}>
      {usersWhoReacted
        .filter(r=>r.reactType!=="disagreed")
        .map((userReactInfo,i) =>
          <span key={userReactInfo.userId} className={classes.userWhoReacted}>
            {(i>0) && <span>{", "}</span>}
            {userReactInfo.displayName}
          </span>
        )
      }
    </div>
    {usersWhoReacted.filter(r=>r.reactType==="disagreed").length > 0 &&
      <div className={classes.usersWhoReacted}>        {usersWhoReacted
          .filter(r=>r.reactType==="disagreed")
          .map((userReactInfo,i) =>
            <span key={userReactInfo.userId} className={classNames(classes.userWhoReacted, classes.antiReacted)}>
              {(i>0) && <span>{", "}</span>}
              {userReactInfo.displayName}
            </span>
          )
        }
      </div>
    }
  </div>
}

const HoverBallotReactionRow = ({reactionName, usersWhoReacted, getCurrentUserReactionVote, setCurrentUserReaction, classes}: {
  reactionName: string,
  usersWhoReacted: UserReactInfo[],
  getCurrentUserReactionVote: (name: string) => VoteOnReactionType|null,
  setCurrentUserReaction: (reactionName: string, reaction: VoteOnReactionType|null)=>void
  classes: ClassesType,
}) => {
  const { ReactionIcon } = Components;
  const netReactionCount = sumBy(usersWhoReacted, r=>r.reactType==="disagreed"?-1:1);

  return <div
    key={reactionName}
    className={classNames(classes.hoverBallotEntry)}
  >
    <ReactionIcon react={reactionName}/>
    <span className={classes.hoverBallotLabel}>
      {namesAttachedReactionsByName[reactionName].label}
    </span>
    
    <ReactOrAntireactVote
      reactionName={reactionName}
      netReactionCount={netReactionCount}
      currentUserReaction={getCurrentUserReactionVote(reactionName)}
      setCurrentUserReaction={setCurrentUserReaction}
      classes={classes}
    />

    <div className={classes.hoverBallotReactDescription}>
      {namesAttachedReactionsByName[reactionName].description}
    </div>
    
    <div className={classes.usersWhoReacted}>
      <span className={classes.reactionsListLabel}>{"Reacted: "}</span>
      {usersWhoReacted
        .filter(r=>r.reactType!=="disagreed")
        .map((userReactInfo,i) =>
          <span key={userReactInfo.userId} className={classes.userWhoReacted}>
            {(i>0) && <span>{", "}</span>}
            {userReactInfo.displayName}
          </span>
        )
      }
    </div>
    {usersWhoReacted.filter(r=>r.reactType==="disagreed").length > 0 &&
      <div className={classes.usersWhoReacted}>
        <span className={classes.reactionsListLabel}>{"Antireacted: "}</span>
        {usersWhoReacted
          .filter(r=>r.reactType==="disagreed")
          .map((userReactInfo,i) =>
            <span key={userReactInfo.userId} className={classes.userWhoReacted}>
              {(i>0) && <span>{", "}</span>}
              {userReactInfo.displayName}
            </span>
          )
        }
      </div>
    }
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

  return <span className={classes.reactOrAntireact}>
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
  </span>
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

const AddReactionButton = ({voteProps, classes}: {
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

