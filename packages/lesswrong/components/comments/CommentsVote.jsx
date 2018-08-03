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
    fontSize: '1rem',
  },
  open: {}
})

class CommentsVote extends PureComponent {
  render() {
    const { comment, classes, currentUser } = this.props
    const allVotes = comment && comment.allVotes;
    const baseScore = getSetting('AlignmentForum', false) ? comment.afBaseScore : comment.baseScore

    return (
      <div className={classNames("comments-item-vote"), classes.vote}>
        {(!getSetting('AlignmentForum', false) || !!comment.af) &&
          <span>
            <Tooltip
              title="Click-and-hold for strong vote"
              placement="bottom"
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
              placement="bottom"
              classes={{tooltip: classes.tooltip, open: classes.open}}
            >
              <span className={classes.voteScore} title={allVotes &&`${allVotes.length} ${allVotes.length == 1 ? "Vote" : "Votes"}`}>
                {baseScore || 0}
              </span>
            </Tooltip>
            <Tooltip
              title="Click-and-hold for strong vote"
              placement="bottom"
              classes={{tooltip: classes.tooltip, open: classes.open}}
            >
              <span title="Click-and-hold for Strong Upvote">
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
          <Tooltip
            title="Alignment Forum Karma"
            placement="bottom"
            classes={{tooltip: classes.tooltip, open: classes.open}}
          >
            <span className={classes.afScore}>
              <span className={classes.afSymbol}>Ω</span>
              <span className={classes.afScoreNumber}>{comment.afBaseScore || 0}</span>
            </span>
          </Tooltip>
        }
        {!comment.af && getSetting('AlignmentForum', false) &&
          <Tooltip
            title="LessWrong Karma"
            placement="bottom"
            classes={{tooltip: classes.tooltip, open: classes.open}}
          >
            <span className={classes.afScore}>
              <span className={classes.afSymbol}>LW</span>
              <span className={classes.afScoreNumber}>{comment.baseScore || 0}</span>
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
