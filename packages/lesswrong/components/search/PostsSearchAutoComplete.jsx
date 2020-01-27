import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core'
import { algoliaIndexNames } from '../../lib/algoliaUtil';

const PostsSearchAutoComplete = ({clickAction}) => {
  return <Components.SearchAutoComplete
    indexName={algoliaIndexNames.Posts}
    clickAction={clickAction}
    renderSuggestion={hit => <Components.PostsListEditorSearchHit hit={hit} />}
    placeholder='Search for posts'
    noSearchPlaceholder='Post ID'
  />
}

registerComponent("PostsSearchAutoComplete", PostsSearchAutoComplete);
