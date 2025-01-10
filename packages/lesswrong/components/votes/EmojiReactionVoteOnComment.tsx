import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { CommentVotingComponentProps, EmojiReactionType, emojiReactions } from '../../lib/voting/votingSystems';
import { useVote } from './withVote';
import { useHover } from '../common/withHover';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';
import classNames from 'classnames';
import { VotingProps } from './votingProps';

const styles = (theme: ThemeType) => ({
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
        background: theme.palette.background.primaryDim,
      },
    },
  },
  voteButtonSelected: {
    background: theme.palette.grey[200],
  },
  emojiReactionsAxisRoot: {
    marginLeft: 10,
  },
  addReactionIcon: {
    verticalAlign: 'text-bottom',
    fontSize: 20,
    cursor: "pointer",
    '& g': {
      fill: theme.palette.grey[500],
    },
    '@media (hover: hover)': {
      "&:hover": {
        '& g': {
          fill: theme.palette.grey[300],
        }
      },
    },
  },
  scores: {
    display: 'inline-block',
    fontFamily: theme.typography.commentStyle.fontFamily,
    fontSize: 12,
    lineHeight: '12px',
  },
  score: {
    display: "inline-flex",
    columnGap: 4,
    padding: '6px 6px 4px',
    borderRadius: 3,
    border: theme.palette.border.extraFaint,
    marginLeft: 4,
  },
  icon: {
    color: theme.palette.text.slightlyDim,
  }
});

interface EmojiReactionVoteOnCommentProps extends CommentVotingComponentProps {
  classes: ClassesType<typeof styles>
}

const EmojiReaction = ({reaction, voteProps, classes}: {
  reaction: EmojiReactionType,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType<typeof styles>,
}) => {
  const count = voteProps.document?.extendedScore?.[reaction.name] || 0
  if (!count) return null

  return <div className={classes.score}>
    <span className={classes.icon}>{reaction.icon}</span>
    <span>{count}</span>
  </div>
}

const BallotEmojiReaction = ({reaction, voteProps, classes}: {
  reaction: EmojiReactionType,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType<typeof styles>,
}) => {
  const isSelected = !!voteProps.document?.currentUserExtendedVote?.[reaction.name]
  const { openDialog } = useDialog()
  const currentUser = useCurrentUser()
  
  return <div className={classNames(classes.voteButton, {[classes.voteButtonSelected]: isSelected})} onClick={async () => {
    if (!currentUser) {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {}
      })
    } else {
      await voteProps.vote({
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

const EmojiReactionsAxis = ({voteProps, classes}: {
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType<typeof styles>,
}) => {
  const { hover, anchorEl, eventHandlers } = useHover()
  
  const { PopperCard } = Components
  
  // Only show the +reaction icon if there aren't any reactions yet.
  // Icon borrowed from here: https://iconduck.com/icons/67395/emoji-add
  const hasReactions = emojiReactions.some(reaction => voteProps.document?.extendedScore?.[reaction.name])
  
  return <span className={classes.emojiReactionsAxisRoot} {...eventHandlers}>
    <span className={classes.scores}>
      {emojiReactions.map(reaction =>
        <EmojiReaction key={reaction.name} reaction={reaction} voteProps={voteProps} classes={classes}/>
      )}
      {/* eaforum-look-here: you can swap this for AddReactionIcon.tsx now */}
      {!hasReactions && <svg className={classNames("MuiSvgIcon-root", classes.addReactionIcon)} fill="none" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
        <g fill="#212121">
          <path d="m13 7c0-3.31371-2.6863-6-6-6-3.31371 0-6 2.68629-6 6 0 3.3137 2.68629 6 6 6 .08516 0 .1699-.0018.25419-.0053-.11154-.3168-.18862-.6499-.22673-.9948l-.02746.0001c-2.76142 0-5-2.23858-5-5s2.23858-5 5-5 5 2.23858 5 5l-.0001.02746c.3449.03811.678.11519.9948.22673.0035-.08429.0053-.16903.0053-.25419z"/>
          <path d="m7.11191 10.4982c.08367-.368.21246-.71893.38025-1.04657-.15911.03174-.32368.04837-.49216.04837-.74037 0-1.40506-.3212-1.86354-.83346-.18417-.20576-.50026-.22327-.70603-.03911-.20576.18417-.22327.50026-.03911.70603.64016.71524 1.57205 1.16654 2.60868 1.16654.03744 0 .07475-.0006.11191-.0018z"/>
          <path d="m6 6c0 .41421-.33579.75-.75.75s-.75-.33579-.75-.75.33579-.75.75-.75.75.33579.75.75z"/>
          <path d="m8.75 6.75c.41421 0 .75-.33579.75-.75s-.33579-.75-.75-.75-.75.33579-.75.75.33579.75.75.75z"/>
          <path d="m15 11.5c0 1.933-1.567 3.5-3.5 3.5s-3.5-1.567-3.5-3.5 1.567-3.5 3.5-3.5 3.5 1.567 3.5 3.5zm-3-2c0-.27614-.2239-.5-.5-.5s-.5.22386-.5.5v1.5h-1.5c-.27614 0-.5.2239-.5.5s.22386.5.5.5h1.5v1.5c0 .2761.2239.5.5.5s.5-.2239.5-.5v-1.5h1.5c.2761 0 .5-.2239.5-.5s-.2239-.5-.5-.5h-1.5z"/>
        </g>
      </svg>}
    </span>
    
    {hover && <PopperCard open={!!hover} anchorEl={anchorEl} placement="bottom-start">
      <div className={classes.hoverBallot}>
        {emojiReactions.map(react => <BallotEmojiReaction key={react.name} reaction={react} voteProps={voteProps} classes={classes}/>)}
      </div>
    </PopperCard>}
  </span>
}

const EmojiReactionVoteOnComment = ({document, hideKarma=false, collectionName, votingSystem, classes}: EmojiReactionVoteOnCommentProps) => {
  const voteProps = useVote(document, collectionName, votingSystem)
  
  const { OverallVoteAxis } = Components
  
  return <span className={classes.root}>
    <OverallVoteAxis
      document={document}
      hideKarma={hideKarma}
      voteProps={voteProps}
    />
    <EmojiReactionsAxis voteProps={voteProps} classes={classes} />
  </span>
}


const EmojiReactionVoteOnCommentComponent = registerComponent('EmojiReactionVoteOnComment', EmojiReactionVoteOnComment, {styles});

declare global {
  interface ComponentTypes {
    EmojiReactionVoteOnComment: typeof EmojiReactionVoteOnCommentComponent
  }
}

