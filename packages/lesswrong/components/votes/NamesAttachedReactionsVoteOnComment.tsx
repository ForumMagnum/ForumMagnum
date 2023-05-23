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
    marginLeft: 10,
    lineHeight: 0.6,
    height: 24,
    outline: theme.palette.border.commentBorder,
    textAlign: 'center',
    whiteSpace: "nowrap",
    zIndex: theme.zIndexes.reactionsFooter,
    
    position: "absolute",
    right: 20,
    bottom: -8,
    background: theme.palette.panelBackground.default,
    borderRadius: 6,
  },
  footerReaction: {
    height: 24,
    display: "inline-block",
    paddingTop: 2,
    paddingLeft: 3,
    paddingRight: 3,
    "&:first-child": {
      paddingLeft: 7,
    },
    "&:last-child": {
      paddingRight: 7,
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
    marginLeft: 8,
    filter: "opacity(0.4)",
    "& svg": {
      width: 18,
      height: 18,
    },
    "&:hover": {
      filter: "opacity(0.8)",
    },
  },
  reactOrAntireact: {
    marginLeft: 12,
  },
  hoverBallot: {
    fontFamily: theme.typography.commentStyle.fontFamily,
    paddingTop: 12,
    paddingBottom: 12,
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
  usersWhoReacted: {
    marginLeft: 25,
    fontSize: 11,
  },
  alreadyUsedReactions: {
    marginBottom: 12,
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
    <AddReactionButton voteProps={voteProps} classes={classes}/>
  </span>
}

const NamesAttachedReactionsCommentBottom = ({
  document, hideKarma=false, collection, votingSystem, classes
}: CommentVotingComponentProps & WithStylesProps) => {
  const voteProps = useVote(document, collection.options.collectionName, votingSystem);
  const anchorEl = useRef<HTMLElement|null>(null);

  const extendedScore = document?.extendedScore as NamesAttachedReactionsScore|undefined;
  const reactionsShown = reactionsListToDisplayedNumbers(extendedScore?.reacts ?? null);
  
  if (!reactionsShown.length) {
    return null;
  }
  
  return <span className={classes.footerReactions} ref={anchorEl}>
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
  const { toggleReaction } = useNamesAttachedReactionsVoting(voteProps);

  function reactionClicked(reaction: EmojiReactName) {
    toggleReaction(reaction);
  }
  
  return <span
    {...eventHandlers} className={classes.footerReaction}
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
  const { ReactionsPalette } = Components;


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
        {alreadyUsedReactionTypesByKarma.map(r =>
          <HoverBallotReactionRow
            key={r}
            reactionName={r}
            usersWhoReacted={alreadyUsedReactions[r]!}
            getCurrentUserReactionVote={getCurrentUserReactionVote}
            setCurrentUserReaction={setCurrentUserReaction}
            classes={classes}
          />
        )}
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
          placement="bottom-start"
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

