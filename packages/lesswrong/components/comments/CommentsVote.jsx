import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import { Comments } from "meteor/example-forum";
import Tooltip from '@material-ui/core/Tooltip';

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
  }
})

class CommentsVote extends PureComponent {
  render() {
    const { comment, classes, currentUser } = this.props
    const voteCount = comment ? comment.voteCount : 0;
    const baseScore = getSetting('AlignmentForum', false) ? comment.afBaseScore : comment.baseScore

    return (
      <div className={classNames("comments-item-vote"), classes.vote}>
        {(!getSetting('AlignmentForum', false) || !!comment.af) &&
          <span>
            <Tooltip title={<div>Downvote<br /><em>(Click-and-hold for strong downvote)</em></div>} placement="bottom">
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
            <Tooltip title={`voteCount ${voteCount == 1 ? "Vote" : "Votes"}`} placement="bottom">
              <span className={classes.voteScore}>
                {baseScore || 0}
              </span>
            </Tooltip>
            <Tooltip title={<div>Upvote<br /><em>(Click-and-hold for strong upvote)</em></div>} placement="bottom">
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
          <Tooltip title="Alignment Forum Karma" placement="bottom">
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

registerComponent('CommentsVote', CommentsVote, withStyles(styles));
