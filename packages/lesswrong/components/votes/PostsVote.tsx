import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser';
import { useVote } from './withVote';
import { forumTypeSetting } from '../../lib/instanceSettings';

const styles = theme => ({
  upvote: {
    marginBottom: -22
  },
  downvote: {
    marginTop: -25
  },
  voteScores: {
    margin:"15%",
  },
  voteScore: {
    color: theme.palette.grey[500],
    paddingLeft: 1, // For some weird reason having this padding here makes it look more centered
    position: 'relative',
    zIndex: theme.zIndexes.postsVote,
    fontSize: '55%',
  },
  secondaryVoteScore: {
    fontSize: '35%',
    marginBottom: 2,
  },
  voteBlock: {
    width: 50,
  },
  tooltip: {
    color: theme.palette.grey[500],
    fontSize: '1rem',
    backgroundColor: 'white',
    transition: 'opacity 150ms cubic-bezier(0.4, 0, 1, 1) 0ms',
    marginLeft: 0
  },
})

const PostsVote = ({ post, classes, collection }: {
  post: PostsBase,
  classes: ClassesType,
  collection: any,
}) => {
  const currentUser = useCurrentUser();
  const vote = useVote("Posts");
  const baseScore = forumTypeSetting.get() === 'AlignmentForum' ? post.afBaseScore : post.baseScore

  return (
      <div className={classes.voteBlock}>
        <Tooltip
          title="Click-and-hold for strong vote"
          placement="right"
          classes={{tooltip: classes.tooltip}}
        >
          <div className={classes.upvote}>
            <Components.VoteButton
              orientation="up"
              color="secondary"
              voteType="Upvote"
              document={post}
              currentUser={currentUser}
              collection={collection}
              vote={vote}
            />
          </div>
        </Tooltip>
        <div className={classes.voteScores}>
          <Tooltip
            title={`${post.voteCount} ${post.voteCount == 1 ? "Vote" : "Votes"}`}
            placement="right"
            classes={{tooltip: classes.tooltip}}
          >
            <Typography variant="headline" className={classes.voteScore}>{baseScore || 0}</Typography>
          </Tooltip>

          {!!post.af && !!post.afBaseScore && forumTypeSetting.get() !== 'AlignmentForum' &&
            <Tooltip
              title="AI Alignment Forum karma"
              placement="right"
              classes={{tooltip: classes.tooltip}}
            >
              <Typography
                variant="headline"
                className={classNames(classes.voteScore, classes.secondaryVoteScore)}>
                Ω {post.afBaseScore}
              </Typography>
            </Tooltip>
          }
        </div>
        <Tooltip
          title="Click-and-hold for strong vote"
          placement="right"
          classes={{tooltip: classes.tooltip}}
        >
          <div className={classes.downvote}>
            <Components.VoteButton
              orientation="down"
              color="error"
              voteType="Downvote"
              document={post}
              currentUser={currentUser}
              collection={collection}
              vote={vote}
            />
          </div>
        </Tooltip>
      </div>)
}

const PostsVoteComponent = registerComponent('PostsVote', PostsVote, {styles});

declare global {
  interface ComponentTypes {
    PostsVote: typeof PostsVoteComponent
  }
}

