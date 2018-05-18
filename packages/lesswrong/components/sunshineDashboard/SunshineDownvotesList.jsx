import { Components, registerComponent, withList, withCurrentUser } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Votes } from 'meteor/vulcan:voting';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router'

class SunshineDownvotesList extends Component {
  render () {
    const results = this.props.results

    if (results &&
        results.length &&
        Users.canDo(this.props.currentUser, "posts.moderate.all")) {

      let downvotees = {}
      results.forEach((vote) => {
        if (Object.keys(downvotees).includes(vote.documentUserSlug)) {
          downvotees[vote.documentUserSlug].push(vote.userId)
        } else {
          downvotees[vote.documentUserSlug] = [vote.userId]
        }
      })

      return (
        <div className="sunshine-votes-list">
          <div className="sunshine-sidebar-title">Unreviewed Votes</div>
          { results >= 200 && <div>Note: 200+ votes loaded</div>}
          {Object.keys(downvotees).map(votee => {
            return (downvotees[votee].length > 1) && <div key={votee._id}>
                <div>
                  <a href={"/usersById/" + votee}>{ votee.slice(0,5) }... { downvotees[votee].length}</a>
                </div>
                <ul>
                  { downvotees[votee] && downvotees[votee].map((downvoterId) => <li>{ downvoterId }</li>)}
                </ul>
              </div>
            })
          }
        </div>
      )
    } else {
      return null
    }
  }
}

const withListOptions = {
  collection: Votes,
  queryName: 'sunshineVotesListQuery',
  fragmentName: 'SunshineVoteFragment',
};

registerComponent(
  'SunshineDownvotesList',
  SunshineDownvotesList,
  [withList, withListOptions],
  withCurrentUser
);
