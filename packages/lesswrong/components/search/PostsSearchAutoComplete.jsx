import React from 'react';
import { registerComponent, Components, getSetting } from 'meteor/vulcan:core'
import { InstantSearch } from 'react-instantsearch-dom';
import { algoliaIndexNames } from '../../lib/algoliaIndexNames.js';

const PostsSearchAutoComplete = ({clickAction}) => {
  const algoliaAppId = getSetting('algolia.appId')
  const algoliaSearchKey = getSetting('algolia.searchKey')
  
  return <InstantSearch
    indexName={algoliaIndexNames.Posts}
    appId={algoliaAppId}
    apiKey={algoliaSearchKey}
  >
    <Components.SearchAutoComplete
      clickAction={suggestion => clickAction(suggestion._id)}
      renderSuggestion={hit => <Components.PostsListEditorSearchHit hit={hit} />}
      placeholder='Search for posts'
    />
  </InstantSearch>
}

registerComponent("PostsSearchAutoComplete", PostsSearchAutoComplete);
