import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib'
import { getSearchIndexName } from '../../lib/search/searchUtil';

const PostsSearchAutoComplete = ({clickAction, placeholder='Search for posts'}: {
  clickAction: (id: string) => void,
  placeholder?: string
}) => {
  return <Components.SearchAutoComplete
    indexName={getSearchIndexName("Posts")}
    clickAction={clickAction}
    renderSuggestion={(hit: any) => <Components.PostsListEditorSearchHit hit={hit} />}
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

