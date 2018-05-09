import { Components, registerComponent, withList, withCurrentUser } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';

class SunshineCuratedSuggestionsList extends Component {
  render () {
    const results = this.props.results
    if (results && results.length && Users.canDo(this.props.currentUser, "posts.moderate.all")) {
      return (
        <div className="sunshine-curated-suggestions-list">
          <div className="sunshine-sidebar-title">Suggestions for Curated</div>
          {this.props.results.map(post =>
            <div key={post._id} >
              <Components.SunshineCuratedSuggestionsItem post={post}/>
            </div>
          )}
        </div>
      )
    } else {
      return null
    }
  }
}

const withListOptions = {
  collection: Posts,
  queryName: 'sunshineCuratedsuggestionsListQuery',
  fragmentName: 'LWPostsList',
  totalResolver: true,
  enableCache: true,
  fetchPolicy: 'cache-and-network'
};

registerComponent(
  'SunshineCuratedSuggestionsList',
  SunshineCuratedSuggestionsList,
  [withList, withListOptions],
  withCurrentUser
);
