import { Components, registerComponent, withCurrentUser } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import { Comments } from "meteor/example-forum";

const styles = theme => ({
  vote: {
    fontSize: 19,
    lineHeight: 0.6,
  },
  voteScore: {
    fontSize: '1.1rem',
    marginLeft: 4,
    marginRight: 4,
    lineHeight: 1,
  },
  afSymbol: {
    fontFamily: theme.typography.body1.fontFamily,
  },
  afScore: {
    fontSize: '1.1rem',
    marginLeft: 7,
  },
  afScoreNumber: {
    marginLeft: 3,
  }
})

class CommentsVote extends PureComponent {
  render() {
    const { comment, classes, currentUser } = this.props

    return (
      <div className={classNames("comments-item-vote"), classes.vote}>
        <Components.VoteButton
          orientation="left"
          color="error"
          voteType="Downvote"
          document={comment}
          currentUser={currentUser}
          collection={Comments}
        />
        <span className={classes.voteScore}>
          {comment.baseScore || 0}
        </span>
        <Components.VoteButton
          orientation="right"
          color="secondary"
          voteType="Upvote"
          document={comment}
          currentUser={currentUser}
          collection={Comments}
        />
        {!!comment.af && <span className={classes.afScore}>
          <span className={classes.afSymbol}>Ω</span>
          <span className={classes.afScoreNumber}>{comment.afBaseScore || 0}</span>
        </span>}
      </div>)
    }
}

CommentsVote.propTypes = {
  comment: PropTypes.object.isRequired, // the document to upvote
  currentUser: PropTypes.object, // user might not be logged in, so don't make it required
  classes: PropTypes.object.isRequired
};

registerComponent('CommentsVote', CommentsVote, withStyles(styles), withCurrentUser);
