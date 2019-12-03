import React from 'react';
import { registerComponent, Components, getSetting } from 'meteor/vulcan:core'
import { InstantSearch } from 'react-instantsearch-dom';
import { algoliaIndexNames } from '../../lib/algoliaIndexNames.js';

const UsersSearchAutoComplete = ({clickAction, label}) => {
  const algoliaAppId = getSetting('algolia.appId')
  const algoliaSearchKey = getSetting('algolia.searchKey')

  if(!algoliaAppId) {
    return <div>User search is disabled (Algolia App ID not configured on server)</div>
  }

  return <InstantSearch
    indexName={algoliaIndexNames.Users}
    appId={algoliaAppId}
    apiKey={algoliaSearchKey}
  >
    <Components.SearchAutoComplete
      clickAction={suggestion => clickAction(suggestion.objectID)}
      renderSuggestion={hit => <Components.UsersAutoCompleteHit document={hit} />}
      placeholder={label || "Search for Users"}
    />
  </InstantSearch>
}

registerComponent("UsersSearchAutoComplete", UsersSearchAutoComplete);
