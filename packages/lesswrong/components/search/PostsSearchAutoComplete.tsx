import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib'
import { algoliaIndexNames } from '../../lib/algoliaUtil';

const PostsSearchAutoComplete = ({clickAction, placeholder='Search for posts'}:{
  clickAction: any,
  placeholder?: string
}) => {
  return <Components.SearchAutoComplete
    indexName={algoliaIndexNames.Posts}
    clickAction={clickAction}
    renderSuggestion={hit => <Components.PostsListEditorSearchHit hit={hit} />}
    placeholder={placeholder}
    noSearchPlaceholder='Post ID'
  />
}

const PostsSearchAutoCompleteComponent = registerComponent("PostsSearchAutoComplete", PostsSearchAutoComplete);

declare global {
  interface ComponentTypes {
    PostsSearchAutoComplete: typeof PostsSearchAutoCompleteComponent
  }
}

