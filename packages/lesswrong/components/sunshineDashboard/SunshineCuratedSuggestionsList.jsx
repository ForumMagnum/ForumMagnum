import { Components, registerComponent, withList, withCurrentUser } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from 'meteor/example-forum';

class SunshineCuratedSuggestionsList extends Component {
  render () {
    const results = this.props.results
    if (results && results.length) {
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
};

registerComponent(
  'SunshineCuratedSuggestionsList',
  SunshineCuratedSuggestionsList,
  [withList, withListOptions],
  withCurrentUser
);
