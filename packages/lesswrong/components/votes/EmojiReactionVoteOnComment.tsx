import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { CommentVotingComponentProps, EmojiReaction, emojiReactions } from '../../lib/voting/votingSystems';
import { useVote, VotingProps } from './withVote';
import { useHover } from '../common/withHover';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
  },
  hoverBallot: {
    display: 'flex',
    columnGap: 6,
    padding: 6,
  },
  voteButton: {
    padding: '3px 6px',
    fontSize: 16,
    cursor: "pointer",
    '@media (hover: hover)': {
      "&:hover": {
        background: theme.palette.background.primaryDim2,
      },
    },
  },
  voteButtonSelected: {
    background: theme.palette.grey[200],
  },
  scores: {
    display: 'inline-block',
    fontFamily: theme.typography.commentStyle.fontFamily,
    fontSize: 12,
    lineHeight: '12px',
    marginLeft: 16
  },
  score: {
    display: "inline-flex",
    columnGap: 4,
    padding: '6px 6px 4px',
    borderRadius: 3,
    border: theme.palette.border.extraFaint,
    marginRight: 4,
  },
  icon: {
    color: theme.palette.text.slightlyDim,
  }
});

interface EmojiReactionVoteOnCommentProps extends CommentVotingComponentProps {
  classes: ClassesType
}

const ReactionDisplay = ({reaction, voteProps, classes}: {
  reaction: EmojiReaction,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType,
}) => {
  const count = voteProps.document?.extendedScore?.[reaction.name] || 0
  if (!count) return null

  return <div className={classes.score}>
    <span className={classes.icon}>{reaction.icon}</span>
    <span>{count}</span>
  </div>
}

const BallotEmojiReaction = ({reaction, voteProps, classes}: {
  reaction: EmojiReaction,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType,
}) => {
  const isSelected = !!voteProps.document?.currentUserExtendedVote?.[reaction.name]
  const { openDialog } = useDialog()
  const currentUser = useCurrentUser()
  
  return <div className={classNames(classes.voteButton, {[classes.voteButtonSelected]: isSelected})} onClick={() => {
    if (!currentUser) {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {}
      })
    } else {
      voteProps.vote({
        document: voteProps.document,
        voteType: voteProps.document.currentUserVote || null,
        extendedVote: {
          ...voteProps.document.currentUserExtendedVote,
          [reaction.name]: !isSelected,
        },
        currentUser,
      })
    }
  }}>
    {reaction.icon}
  </div>
}

const EmojiReactionVoteOnComment = ({document, hideKarma=false, collection, votingSystem, classes}: EmojiReactionVoteOnCommentProps) => {
  const voteProps = useVote(document, collection.options.collectionName, votingSystem)
  const { hover, anchorEl, eventHandlers } = useHover()
  
  const { OverallVoteAxis, PopperCard } = Components
  
  return <span className={classes.root} {...eventHandlers}>
    <OverallVoteAxis
      document={document}
      hideKarma={hideKarma}
      voteProps={voteProps}
      hideTooltips
    />
    
    <span className={classes.scores}>
      {emojiReactions.map(reaction =>
        <ReactionDisplay key={reaction.name} reaction={reaction} voteProps={voteProps} classes={classes}/>
      )}
    </span>
    
    {hover && <PopperCard open={!!hover} anchorEl={anchorEl} placement="bottom-start">
      <div className={classes.hoverBallot}>
        {emojiReactions.map(react => <BallotEmojiReaction key={react.name} reaction={react} voteProps={voteProps} classes={classes}/>)}
      </div>
    </PopperCard>}
  </span>
}


const EmojiReactionVoteOnCommentComponent = registerComponent('EmojiReactionVoteOnComment', EmojiReactionVoteOnComment, {styles});

declare global {
  interface ComponentTypes {
    EmojiReactionVoteOnComment: typeof EmojiReactionVoteOnCommentComponent
  }
}

