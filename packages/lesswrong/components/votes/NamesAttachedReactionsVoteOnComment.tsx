import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { CommentVotingComponentProps, NamesAttachedReactionsList, NamesAttachedReactionsVote, NamesAttachedReactionsScore, EmojiReactName, newReactKarmaThreshold, existingReactKarmaThreshold } from '../../lib/voting/votingSystems';
import { namesAttachedReactions, namesAttachedReactionsByName, NamesAttachedReactionType } from '../../lib/voting/reactions';
import type { VotingProps } from './withVote';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser';
import { useVote } from './withVote';
import { useHover } from '../common/withHover';
import { useDialog } from '../common/withDialog';
import InsertEmoticonOutlined from '@material-ui/icons/InsertEmoticon';
import withErrorBoundary from '../common/withErrorBoundary';
import filter from 'lodash/filter';
import orderBy from 'lodash/orderBy';

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
  addReactionButton: {
    verticalAlign: "middle",
    filter: "opacity(0.4)",
    "& svg": {
      width: 18,
      height: 18,
    },
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
  selected: {
    background: theme.palette.panelBackground.darken10,
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
  </span>
}

const NamesAttachedReactionsCommentBottom = ({document, hideKarma=false, collection, votingSystem, classes}: CommentVotingComponentProps & WithStylesProps) => {
  const voteProps = useVote(document, collection.options.collectionName, votingSystem);

  return <NamesAttachedReactionsAxis
    document={document}
    hideKarma={hideKarma}
    voteProps={voteProps}
    classes={classes}
  />
}

const NamesAttachedReactionsAxis = ({document, hideKarma=false, voteProps, classes}: {
  document: VoteableTypeClient,
  hideKarma?: boolean,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType
}) => {
  const { hover, anchorEl, eventHandlers } = useHover()
  const { PopperCard } = Components;
  const extendedScore = document?.extendedScore as NamesAttachedReactionsScore|undefined;
  const reactions = extendedScore?.reacts;
  const reactionTypesUsed: string[] = reactions ? Object.keys(reactions): [];
  const sortedReactionTypes = reactionTypesUsed; //TODO
  
  return <span className={classes.reactions} {...eventHandlers}>
    {!hideKarma && sortedReactionTypes.map(reactionType => <span key={reactionType}>
      <ReactionIcon react={reactionType} onClick={()=>{}} classes={classes}/>
    </span>)}
    {(hideKarma || sortedReactionTypes.length===0) && <AddReactionButton classes={classes}/>}
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
  const { LWTooltip } = Components;
  const currentUserExtendedVote = voteProps.document?.currentUserExtendedVote as NamesAttachedReactionsVote|undefined;

  function reactionIsSelected(name: string): boolean {
    const reacts: string[] = currentUserExtendedVote?.reacts ?? [];
    return !!reacts.find(r=>r===name);
  }

  function toggleReaction(name: string) {
    if (!currentUser) {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {}
      })
      return;
    }
    
    const oldReacts: string[] = currentUserExtendedVote?.reacts ?? [];
    const newReacts: EmojiReactName[] = reactionIsSelected(name)
      ? filter(oldReacts, r=>r!==name)
      : [...oldReacts, name]

    voteProps.vote({
      document: voteProps.document,
      voteType: voteProps.document.currentUserVote || null,
      extendedVote: {
        ...currentUserExtendedVote,
        reacts: newReacts,
      },
      currentUser,
    });
  }
  
  const extendedScore = voteProps.document?.extendedScore as NamesAttachedReactionsScore|undefined;
  const alreadyUsedReactions: NamesAttachedReactionsList = extendedScore?.reacts ?? {};
  const alreadyUsedReactionTypes: string[] = Object.keys(alreadyUsedReactions);
  const alreadyUsedReactionTypesByKarma = orderBy(alreadyUsedReactionTypes, r=>alreadyUsedReactions[r]![0].karma);
  
  return <div className={classes.hoverBallot}>
    <div className={classes.alreadyUsedReactions}>
      {alreadyUsedReactionTypesByKarma.map(r => <div
        key={r}
        className={classNames(classes.hoverBallotEntry, {
          [classes.selected]: reactionIsSelected(r)
        })}
      >
        <ReactionIcon react={r} classes={classes}/>
        <span className={classes.hoverBallotLabel}>{namesAttachedReactionsByName[r].label}</span>
        
        <div className={classes.usersWhoReacted}>
          {alreadyUsedReactions[r]!.map((userReactInfo,i) =>
            <span key={userReactInfo.userId}>
              {(i>0) && <span>{", "}</span>}
              {userReactInfo.displayName}
            </span>
          )}
        </div>
      </div>)}
    </div>
    
    <div className={classes.moreReactions}>
      {namesAttachedReactions.map(reaction =>
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
              [classes.selected]: reactionIsSelected(reaction.name)
            })}
            onClick={ev => toggleReaction(reaction.name)}
          >
            <ReactionIcon react={reaction.name} classes={classes}/>
            <span className={classes.hoverBallotLabel}>{reaction.label}</span>
          </div>
        </LWTooltip>
      )}
    </div>
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
  return <span className={classes.reactionEmoji}>😀</span>
}

const AddReactionButton = ({classes}: {
  classes: ClassesType
}) => {
  //return <span className={classes.addReactionButton}>😀</span>
  return <span className={classes.addReactionButton}>
    <InsertEmoticonOutlined/>
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

