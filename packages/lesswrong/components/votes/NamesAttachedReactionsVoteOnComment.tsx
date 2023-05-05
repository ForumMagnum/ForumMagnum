import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { CommentVotingComponentProps, } from '../../lib/voting/votingSystems';
import { NamesAttachedReactionsList, NamesAttachedReactionsVote, NamesAttachedReactionsScore, EmojiReactName, UserReactInfo, addNewReactKarmaThreshold, addNameToExistingReactKarmaThreshold, downvoteExistingReactKarmaThreshold, UserVoteOnSingleReaction, VoteOnReactionType, reactionsListToDisplayedNumbers } from '../../lib/voting/namesAttachedReactions';
import { namesAttachedReactions, namesAttachedReactionsByName, NamesAttachedReactionType } from '../../lib/voting/reactions';
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
  reactions: {
    display: "inline-block",
    fontSize: 25,
    marginLeft: 10,
    lineHeight: 0.6,
    height: 24,
    paddingTop: 2,
    outline: theme.palette.border.commentBorder,
    textAlign: 'center',
    whiteSpace: "nowrap",
    verticalAlign: "bottom",
    paddingLeft: 4,
    paddingRight: 4,
    
    position: "absolute",
    right: 20,
    bottom: -8,
    background: theme.palette.panelBackground.default,
    borderRadius: 6,
  },
  reactionCount: {
    fontSize: 14,
    fontFamily: theme.typography.commentStyle.fontFamily,
    color: theme.palette.text.dim60,
    marginLeft: 3,
    marginRight: 6,
  },
  addReactionButton: {
    verticalAlign: "bottom",
    marginLeft: 8,
    filter: "opacity(0.4)",
    "& svg": {
      width: 18,
      height: 18,
    },
  },
  reactOrAntireact: {
    marginLeft: 12,
  },
  hoverBallot: {
    fontFamily: theme.typography.commentStyle.fontFamily,
    paddingTop: 12,
    paddingBottom: 12,
  },
  hoverBallotEntry: {
    cursor: "pointer",
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 16,
    paddingRight: 16,
    "&:hover": {
      background: theme.palette.panelBackground.darken04,
    },
  },
  paletteEntry: {
    //display: "inline-block",
    cursor: "pointer",
    padding: 4,
    "&:hover": {
      background: theme.palette.panelBackground.darken04,
    },
  },
  hoverBallotLabel: {
    verticalAlign: "middle",
    marginLeft: 6,
  },
  hoverBallotReactDescription: {
    marginLeft: 25,
  },
  selected: {
    background: theme.palette.panelBackground.darken10,
  },
  selectedAnti: {
    background: "rgb(255, 189, 189, .23)", //TODO themeify
  },
  reactionEmoji: {
    fontSize: 18,
    verticalAlign: "middle",
    filter: "opacity(0.3)",
  },
  reactionSvg: {
    width: 18,
    height: 18,
    filter: "opacity(0.3)",
    verticalAlign: "middle",
  },
  usersWhoReacted: {
    marginLeft: 24,
  },
  alreadyUsedReactions: {
    marginBottom: 12,
  },
  moreReactions: {
    width: 240,
    paddingLeft: 12,
    paddingRight: 12,
  },
  reactionDescription: {
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
  const { hover, anchorEl, eventHandlers } = useHover()
  const { PopperCard } = Components;

  const extendedScore = document?.extendedScore as NamesAttachedReactionsScore|undefined;
  const reactionsShown = reactionsListToDisplayedNumbers(extendedScore?.reacts ?? null);
  
  function reactionClicked(reaction: EmojiReactName) {
    // TODO
  }
  
  if (!reactionsShown.length) {
    return null;
  }
  
  return <span className={classes.reactions} {...eventHandlers}>
    {!hideKarma && reactionsShown.map(({react, numberShown}) => <span key={react}>
      <ReactionIcon
        react={react}
        onClick={()=>{reactionClicked(react)}}
        classes={classes}
      />
      <span className={classes.reactionCount}>{numberShown}</span>
    </span>)}
    {hideKarma && <InsertEmoticonOutlined/>}
    {hover && <PopperCard
      open={!!hover} anchorEl={anchorEl}
      placement="bottom-end"
      allowOverflow={true}
      
    >
      <NamesAttachedReactionsHoverBallot voteProps={voteProps} classes={classes}/>
    </PopperCard>}
  </span>
}

const NamesAttachedReactionsHoverBallot = ({voteProps, classes}: {
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType
}) => {
  const currentUser = useCurrentUser()
  const { openDialog } = useDialog()
  const currentUserExtendedVote = voteProps.document?.currentUserExtendedVote as NamesAttachedReactionsVote|undefined;

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
  
  const extendedScore = voteProps.document?.extendedScore as NamesAttachedReactionsScore|undefined;
  const alreadyUsedReactions: NamesAttachedReactionsList = extendedScore?.reacts ?? {};
  const alreadyUsedReactionTypes: string[] = Object.keys(alreadyUsedReactions);
  const alreadyUsedReactionTypesByKarma = orderBy(alreadyUsedReactionTypes,
    r=> (alreadyUsedReactions[r]!.length>0) ? alreadyUsedReactions[r]![0].karma : 0
  );
  
  return <div className={classes.hoverBallot}>
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
    
    <HoverBallotReactionPalette
      getCurrentUserReactionVote={getCurrentUserReactionVote}
      toggleReaction={toggleReaction}
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
  const netReactionCount = sumBy(usersWhoReacted, r=>r.reactType==="disagreed"?-1:1);

  return <div
    key={reactionName}
    className={classNames(classes.hoverBallotEntry)}
  >
    <ReactionIcon react={reactionName} classes={classes}/>
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
          <span key={userReactInfo.userId}>
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
            <span key={userReactInfo.userId}>
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

const HoverBallotReactionPalette = ({getCurrentUserReactionVote, toggleReaction, classes}: {
  getCurrentUserReactionVote: (name: string) => VoteOnReactionType|null,
  toggleReaction: (reactionName: string)=>void,
  classes: ClassesType
}) => {
  const { LWTooltip } = Components;

  return <div className={classes.moreReactions}>
    {namesAttachedReactions.map(reaction => {
      const currentUserVote = getCurrentUserReactionVote(reaction.name);
      return (
        <LWTooltip key={reaction.name} title={<>
          <div>
            <ReactionIcon react={reaction.name} classes={classes}/>
            <span className={classes.hoverBallotLabel}>{reaction.label}</span>
          </div>
          <ReactionDescription reaction={reaction} classes={classes}/>
        </>}>
          <div
            key={reaction.name}
            className={classNames(classes.paletteEntry, {
              [classes.selected]: (currentUserVote==="created" || currentUserVote==="seconded"),
              [classes.selectedAnti]: currentUserVote==="disagreed",
            })}
            onClick={_ev => toggleReaction(reaction.name)}
          >
            <ReactionIcon react={reaction.name} classes={classes}/>
            <span className={classes.hoverBallotLabel}>{reaction.label}</span>
          </div>
        </LWTooltip>
      )
    })}
  </div>
}

const ReactionIcon = ({react, onClick, classes}: {
  react: string,
  onClick?: ()=>void,
  classes: ClassesType
}) => {
  const reactionType = namesAttachedReactionsByName[react];
  if (!reactionType) {
    return <PlaceholderIcon classes={classes}/>;
  }
  if (reactionType.svg) {
    return <img src={reactionType.svg} className={classes.reactionSvg}/>;
  } else if (reactionType.emoji) {
    return <span className={classes.reactionEmoji}>{reactionType.emoji}</span>;
  } else {
    return <PlaceholderIcon classes={classes}/>;
  }
}

const PlaceholderIcon = ({classes}: {
  classes: ClassesType
}) => {
  return <span className={classes.reactionEmoji}>
    <InsertEmoticonOutlined/>
  </span>
}

const AddReactionButton = ({voteProps, classes}: {
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType
}) => {
  const { hover, anchorEl, eventHandlers } = useHover()
  const { PopperCard } = Components;

  return <span {...eventHandlers} className={classes.addReactionButton}>
    <InsertEmoticonOutlined/>

    {hover && <PopperCard
      open={!!hover} anchorEl={anchorEl}
      placement="bottom-start"
      allowOverflow={false}
      
    >
      <NamesAttachedReactionsHoverBallot voteProps={voteProps} classes={classes}/>
    </PopperCard>}
  </span>
}

const ReactionDescription = ({reaction, classes}: {
  reaction: NamesAttachedReactionType,
  classes: ClassesType,
}) => {
  if (!reaction.description) {
    return null;
  } else if (typeof reaction.description === "string") {
    return <div className={classes.reactionDescription}>{reaction.description}</div>
  } else {
    return <div className={classes.reactioNDescription}>{reaction.description("comment")}</div>
  }
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

