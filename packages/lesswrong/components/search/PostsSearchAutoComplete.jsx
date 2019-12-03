import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core'
import { algoliaIndexNames } from '../../lib/algoliaIndexNames.js';

const PostsSearchAutoComplete = ({clickAction}) => {
  return <Components.SearchAutoComplete
    indexName={algoliaIndexNames.Posts}
    clickAction={suggestion => clickAction(suggestion._id)}
    renderSuggestion={hit => <Components.PostsListEditorSearchHit hit={hit} />}
    placeholder='Search for posts'
  />
}

registerComponent("PostsSearchAutoComplete", PostsSearchAutoComplete);
