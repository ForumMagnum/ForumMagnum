import { Components, replaceComponent, withDocument } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types'; 
import { registerComponent } from 'meteor/vulcan:core';
import { Link, withRouter } from 'react-router'
import { Posts, Comments } from 'meteor/example-forum';
import { getVotePower } from 'meteor/vulcan:voting';

class VotesInfo extends Component {

  render() {
    const document = this.props.document
    return (
      <div className="votes-info">
        <h5 className="votes-info-header">Voting</h5>
        <div className="votes-info-stats">
          { document && (
              <div>
                <div>Score: { document.score } (weighted by time)</div>
                <div>Base Score: { document.baseScore }</div>
              </div>
          )}
          <strong>Upvoters {document && <span>({ document.upvotes })</span>}</strong>
          <ul className="stats-upvoters">
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
          <ul className="stats-downvoters">
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
        <span className="votes-info-reminder">(scroll to see all)</span>
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

registerComponent('CommentVotesInfo', VotesInfo, [withDocument, commentOptions]);
registerComponent('PostVotesInfo', VotesInfo, [withDocument, postOptions]);
