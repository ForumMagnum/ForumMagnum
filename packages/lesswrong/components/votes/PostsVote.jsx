import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import classNames from 'classnames';
import withUser from '../common/withUser';
import { withVote } from './withVote';

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

class PostsVote extends PureComponent {
  render() {
    const { post, classes, currentUser, collection, vote } = this.props
    const baseScore = getSetting('forumType') === 'AlignmentForum' ? post.afBaseScore : post.baseScore

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
              <Typography variant="h5" className={classes.voteScore}>{baseScore || 0}</Typography>
            </Tooltip>

            {!!post.af && !!post.afBaseScore && getSetting('forumType') !== 'AlignmentForum' &&
              <Tooltip
                title="AI Alignment Forum karma"
                placement="right"
                classes={{tooltip: classes.tooltip}}
              >
                <Typography
                  variant="h5"
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
}

PostsVote.propTypes = {
  post: PropTypes.object.isRequired, // the document to upvote
  collection: PropTypes.object.isRequired, // the collection containing the document
  currentUser: PropTypes.object, // user might not be logged in, so don't make it required
  classes: PropTypes.object.isRequired
};

registerComponent('PostsVote', PostsVote, withUser, withVote,
  withStyles(styles, { name: "PostsVote" })
);
