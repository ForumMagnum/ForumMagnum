import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components'
import { getSearchIndexName } from '../../lib/search/searchUtil';

const PostsSearchAutoCompleteInner = ({clickAction, placeholder='Search for posts'}: {
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

export const PostsSearchAutoComplete = registerComponent("PostsSearchAutoComplete", PostsSearchAutoCompleteInner);

declare global {
  interface ComponentTypes {
    PostsSearchAutoComplete: typeof PostsSearchAutoComplete
  }
}

