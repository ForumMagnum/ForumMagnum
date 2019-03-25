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
    fontFamily: theme.typography.body1.fontFamily,
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
    const { comment, classes, currentUser, hover } = this.props
    if (!comment) return null;
    const voteCount = comment.voteCount;
    const baseScore = getSetting('AlignmentForum', false) ? comment.afBaseScore : comment.baseScore

    const moveToAfInfo = Users.isAdmin(currentUser) && !!comment.moveToAlignmentUserId && (
      <div className={classes.tooltipHelp}>
        {hover && <span>Moved to AF by <Components.UsersName documentId={comment.moveToAlignmentUserId }/> on { comment.afDate && moment(new Date(comment.afDate)).format('YYYY-MM-DD') }</span>}
      </div>
    )

    return (
      <div className={classes.vote}>
        {(!getSetting('AlignmentForum', false) || !!comment.af) &&
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
                />
              </span>
            </Tooltip>
            <Tooltip title={`${voteCount} ${voteCount == 1 ? "Vote" : "Votes"}`} placement="bottom">
              <span className={classes.voteScore}>
                {baseScore || 0}
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
                />
              </span>
            </Tooltip>
          </span>
        }
        {!!comment.af && !getSetting('AlignmentForum', false) &&
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
        {!comment.af && getSetting('AlignmentForum', false) &&
          <Tooltip title="LessWrong Karma" placement="bottom">
            <span className={classes.secondaryScore}>
              <span className={classes.secondarySymbol}>LW</span>
              <span className={classes.secondaryScoreNumber}>{comment.baseScore || 0}</span>
            </span>
          </Tooltip>
        }
      </div>)
    }
}

CommentsVote.propTypes = {
  comment: PropTypes.object.isRequired, // the document to upvote
  currentUser: PropTypes.object, // user might not be logged in, so don't make it required
  classes: PropTypes.object.isRequired
};

registerComponent('CommentsVote', CommentsVote,
  withStyles(styles, { name: "CommentsVote" }), withHover, withUser
);
