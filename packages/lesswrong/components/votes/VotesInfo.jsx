import { Components, replaceComponent, withDocument } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from 'meteor/vulcan:core';
import { Link } from 'react-router'
import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments'
import { getVotePower } from '../../lib/modules/vote.js';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    paddingLeft: ".5em",
    borderTop: "solid 1px $light-grey",
  },
  header: {
  },
  reminder: {
    fontSize: "14px",
    fontStyle: "italic",
    marginLeft: "5px",
  },
  stats: {
    // TODO: Update Modal so it displays long content in a reasonable way
    paddingLeft: "1em",
    maxHeight: "200px",
    overflow: "scroll",
  },
  statsUpvoters: {
  },
  statsDownvoters: {
  },
});

class VotesInfo extends Component {

  render() {
    const { classes, document } = this.props;
    return (
      <div className={classes.root}>
        <h5 className={classes.header}>Voting</h5>
        <div className={classes.stats}>
          { document && (
              <div>
                <div>Score: { document.score } (weighted by time)</div>
                <div>Base Score: { document.baseScore }</div>
              </div>
          )}
          <strong>Upvoters {document && <span>({ document.upvotes })</span>}</strong>
          <ul className={classes.statsUpvoters}>
            { document && document.upvoters.map(
              voter => (
                  <li key={voter._id}>
                    <Link to={{pathname:'/users/' + voter.slug}}>{voter.username} </Link>
                     (Karma: {voter.karma || 0}, Power: {getVotePower(voter)})
                  </li>
                )
            )}
          </ul>
          <strong>Downvoters {document && <span>({ document.downvotes })</span>}</strong>
          <ul className={classes.statsDownvoters}>
            { document && document.downvoters.map(
              voter => (
                <li key={voter._id}>
                  <Link to={{pathname:'/users/' + voter.slug}}>{voter.username} </Link>
                    (Karma: {voter.karma || 0}, Power: {getVotePower(voter)})
                  </li>
                )
            )}
          </ul>
        </div>
        <span className={classes.reminder}>(scroll to see all)</span>
      </div>
    );
  }
}

VotesInfo.propTypes = {
    documentId: PropTypes.string.isRequired,
}

const commentOptions = {
  collection: Comments,
  queryName: 'CommentStatsQuery',
  fragmentName: 'CommentStats',
};

const postOptions = {
  collection: Posts,
  queryName: 'PostStatsQuery',
  fragmentName: 'PostStats',
};

registerComponent('CommentVotesInfo', VotesInfo,
  [withDocument, commentOptions],
  withStyles(styles, { name: "CommentVotesInfo" })
);
registerComponent('PostVotesInfo', VotesInfo,
  [withDocument, postOptions],
  withStyles(styles, { name: "PostVotesInfo" })
);
