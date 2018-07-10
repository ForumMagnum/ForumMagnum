import { Components, registerComponent, withCurrentUser, getSetting } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import { Comments } from "meteor/example-forum";
import Tooltip from '@material-ui/core/Tooltip';

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
  },
  tooltip: {
    color: theme.palette.grey[500],
    fontSize: '1rem',
    backgroundColor: 'white',
    transition: 'opacity 150ms cubic-bezier(0.4, 0, 1, 1) 0ms',
    marginLeft: 5,
    '&$open': {
      opacity: 1,
      transition: 'opacity 150ms cubic-bezier(0.4, 0, 1, 1) 0ms'
    }
  },
  open: {}
})

class CommentsVote extends PureComponent {
  render() {
    const { comment, classes, currentUser } = this.props
    const allVotes = comment && comment.allVotes;
    const baseScore = getSetting('AlignmentForum', false) ? comment.baseScore : comment.afBaseScore

    return (
      <div className={classNames("comments-item-vote"), classes.vote}>
        <Tooltip
          title="Click-and-hold for strong vote"
          placement="right"
          classes={{tooltip: classes.tooltip, open: classes.open}}
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
        <Tooltip
          title={allVotes &&`${allVotes.length} ${allVotes.length == 1 ? "Vote" : "Votes"}`}
          placement="right"
          classes={{tooltip: classes.tooltip, open: classes.open}}
        >
          <span className={classes.voteScore}>
            {baseScore || 0}
          </span>
        </Tooltip>
        <Tooltip
          title="Click-and-hold for strong vote"
          placement="right"
          classes={{tooltip: classes.tooltip, open: classes.open}}
        >
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
        {!!comment.af && !getSetting('AlignmentForum', false) &&
          <Tooltip
            title="Alignment Forum karma"
            placement="right"
            classes={{tooltip: classes.tooltip, open: classes.open}}
          >
            <span className={classes.afScore}>
              <span className={classes.afSymbol}>Ω</span>
              <span className={classes.afScoreNumber}>{comment.afBaseScore || 0}</span>
            </span>
          </Tooltip>}
      </div>)
    }
}

CommentsVote.propTypes = {
  comment: PropTypes.object.isRequired, // the document to upvote
  currentUser: PropTypes.object, // user might not be logged in, so don't make it required
  classes: PropTypes.object.isRequired
};

registerComponent('CommentsVote', CommentsVote, withStyles(styles), withCurrentUser);
