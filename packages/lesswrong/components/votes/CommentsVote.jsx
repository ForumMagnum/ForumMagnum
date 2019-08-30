import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Comments } from "../../lib/collections/comments";
import Tooltip from '@material-ui/core/Tooltip';
import Users from 'meteor/vulcan:users';
import moment from 'moment-timezone';
import withHover from '../common/withHover';
import withUser from '../common/withUser';
import { withVote } from './withVote';

const styles = theme => ({
  vote: {
    fontSize: 25,
    lineHeight: 0.6,
  },
  voteScore: {
    fontSize: '1.1rem',
    marginLeft: 4,
    marginRight: 4,
    lineHeight: 1,
  },
  secondarySymbol: {
    fontFamily: theme.typography.body2.fontFamily,
  },
  secondaryScore: {
    fontSize: '1.1rem',
    marginLeft: 7,
  },
  secondaryScoreNumber: {
    marginLeft: 3,
  },
  tooltipHelp: {
    fontSize: '1rem',
    fontStyle: "italic"
  }
})

class CommentsVote extends PureComponent {
  render() {
    const { comment, classes, currentUser, hover, vote } = this.props
    if (!comment) return null;
    const voteCount = comment.voteCount;
    const karma = Comments.getKarma(comment)

    const moveToAfInfo = Users.isAdmin(currentUser) && !!comment.moveToAlignmentUserId && (
      <div className={classes.tooltipHelp}>
        {hover && <span>Moved to AF by <Components.UsersName documentId={comment.moveToAlignmentUserId }/> on { comment.afDate && moment(new Date(comment.afDate)).format('YYYY-MM-DD') }</span>}
      </div>
    )

    return (
      <span className={classes.vote}>
        {(getSetting('forumType') !== 'AlignmentForum' || !!comment.af) &&
          <span>
            <Tooltip
              title={<div>Downvote<br /><em>For strong downvote, click-and-hold<br />(Click twice on mobile)</em></div>}
              placement="bottom"
              >
              <span>
                <Components.VoteButton
                  orientation="left"
                  color="error"
                  voteType="Downvote"
                  document={comment}
                  currentUser={currentUser}
                  collection={Comments}
                  vote={vote}
                />
              </span>
            </Tooltip>
            <Tooltip title={`This comment has ${karma} karma (${voteCount} ${voteCount == 1 ? "Vote" : "Votes"})`} placement="bottom">
              <span className={classes.voteScore}>
                {karma}
              </span>
            </Tooltip>
            <Tooltip
              title={<div>Upvote<br /><em>For strong upvote, click-and-hold<br /> (Click twice on mobile)</em></div>}
              placement="bottom">
              <span>
                <Components.VoteButton
                  orientation="right"
                  color="secondary"
                  voteType="Upvote"
                  document={comment}
                  currentUser={currentUser}
                  collection={Comments}
                  vote={vote}
                />
              </span>
            </Tooltip>
          </span>
        }
        {!!comment.af && getSetting('forumType') !== 'AlignmentForum' &&
          <Tooltip placement="bottom" title={
            <div>
              <p>AI Alignment Forum Karma</p>
              { moveToAfInfo }
            </div>
          }>
            <span className={classes.secondaryScore}>
              <span className={classes.secondarySymbol}>Ω</span>
              <span className={classes.secondaryScoreNumber}>{comment.afBaseScore || 0}</span>
            </span>
          </Tooltip>
        }
        {!comment.af && (getSetting('forumType') === 'AlignmentForum') &&
          <Tooltip title="LessWrong Karma" placement="bottom">
            <span className={classes.secondaryScore}>
              <span className={classes.secondarySymbol}>LW</span>
              <span className={classes.secondaryScoreNumber}>{comment.baseScore || 0}</span>
            </span>
          </Tooltip>
        }
      </span>)
    }
}

CommentsVote.propTypes = {
  comment: PropTypes.object.isRequired, // the document to upvote
  currentUser: PropTypes.object, // user might not be logged in, so don't make it required
  classes: PropTypes.object.isRequired
};

registerComponent('CommentsVote', CommentsVote,
  withStyles(styles, { name: "CommentsVote" }),
  withHover, withUser, withVote
);
