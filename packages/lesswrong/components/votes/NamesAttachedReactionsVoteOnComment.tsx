import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { CommentVotingComponentProps, NamesAttachedReactionsList, NamesAttachedReactionsVote } from '../../lib/voting/votingSystems';
import { namesAttachedReactions, namesAttachedReactionsByName } from '../../lib/voting/reactions';
import type { VotingProps } from './withVote';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser';
import { useVote } from './withVote';
import { useHover } from '../common/withHover';
import { useDialog } from '../common/withDialog';
import { isEAForum } from '../../lib/instanceSettings';
import filter from 'lodash/filter';

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
    minWidth: 60,
    paddingTop: 2,
    outline: theme.palette.border.commentBorder,
    borderRadius: isEAForum ? theme.borderRadius.small : 2,
    textAlign: 'center',
    whiteSpace: "nowrap",
  },
  hoverBallot: {
  },
  hoverBallotEntry: {
    cursor: "pointer",
    "&:hover": {
      background: theme.palette.panelBackground.darken04,
    },
  },
  hoverBallotLabel: {
  },
  selected: {
    background: theme.palette.panelBackground.darken10,
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
    <NamesAttachedReactionsAxis
      document={document}
      hideKarma={hideKarma}
      voteProps={voteProps}
      classes={classes}
    />
  </span>
}

const NamesAttachedReactionsAxis = ({document, hideKarma=false, voteProps, classes}: {
  document: VoteableTypeClient,
  hideKarma?: boolean,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType
}) => {
  const { hover, anchorEl, eventHandlers } = useHover()
  const { PopperCard } = Components;
  const reactions = document?.extendedScore?.reacts as NamesAttachedReactionsList|undefined;
  const reactionTypesUsed: string[] = reactions ? Object.keys(reactions): [];
  const sortedReactionTypes = reactionTypesUsed; //TODO
  
  return <span className={classes.reactions} {...eventHandlers}>
    {!hideKarma && sortedReactionTypes.map(reactionType => <span key={reactionType}>
      <ReactionIcon react={reactionType}/>
    </span>)}
    {(hideKarma || sortedReactionTypes.length===0) && <PlaceholderIcon/>}
    {hover && <PopperCard open={!!hover} anchorEl={anchorEl} placement="bottom-start">
      <NamesAttachedReactionsHoverBallot voteProps={voteProps} classes={classes}/>
    </PopperCard>}
  </span>
}

const NamesAttachedReactionsTooltip = ({voteProps, classes}: {
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType
}) => {
  return <div/> // TODO
}

const NamesAttachedReactionsHoverBallot = ({voteProps, classes}: {
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType
}) => {
  const currentUser = useCurrentUser()
  const { openDialog } = useDialog()

  function reactionIsSelected(name: string): boolean {
    const reacts: string[] = voteProps.document?.currentUserExtendedVote?.reacts ?? [];
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
    
    const oldReacts: string[] = voteProps.document?.currentUserExtendedVote?.reacts ?? [];
    const newReacts: NamesAttachedReactionsVote = reactionIsSelected(name)
      ? filter(oldReacts, r=>r!==name)
      : [...oldReacts, name]

    voteProps.vote({
      document: voteProps.document,
      voteType: voteProps.document.currentUserVote || null,
      extendedVote: {
        ...voteProps.document.currentUserExtendedVote,
        reacts: newReacts,
      },
      currentUser,
    });
  }
  
  return <div className={classes.hoverBallot}>
    {namesAttachedReactions.map(reaction =>
      <div
        key={reaction.name}
        className={classNames(classes.hoverBallotEntry, {
          [classes.selected]: reactionIsSelected(reaction.name)
        })}
        onClick={ev => toggleReaction(reaction.name)}
      >
        <ReactionIcon react={reaction.name}/>
        <span className={classes.hoverBallotLabel}>{reaction.label}</span>
      </div>
    )}
  </div>
}

const ReactionIcon = ({react}: {react: string}) => {
  const reactionType = namesAttachedReactionsByName[react];
  if (!reactionType) {
    return <PlaceholderIcon/>;
  }
  if (reactionType.svg) {
    return <img src={reactionType.svg}/>;
  } else if (reactionType.emoji) {
    return <>{reactionType.emoji}</>;
  } else {
    return <PlaceholderIcon/>;
  }
}
const PlaceholderIcon = () => {
  return <span>😀</span>
}

const NamesAttachedReactionsVoteOnCommentComponent = registerComponent('NamesAttachedReactionsVoteOnComment', NamesAttachedReactionsVoteOnComment, {styles});

declare global {
  interface ComponentTypes {
    NamesAttachedReactionsVoteOnComment: typeof NamesAttachedReactionsVoteOnCommentComponent
  }
}

