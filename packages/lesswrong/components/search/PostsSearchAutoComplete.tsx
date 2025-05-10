import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components'
import { getSearchIndexName } from '../../lib/search/searchUtil';
import { SearchAutoComplete } from "./SearchAutoComplete";
import { PostsListEditorSearchHit } from "./PostsListEditorSearchHit";

const PostsSearchAutoCompleteInner = ({clickAction, placeholder='Search for posts'}: {
  clickAction: (id: string) => void,
  placeholder?: string
}) => {
  return <SearchAutoComplete
    indexName={getSearchIndexName("Posts")}
    clickAction={clickAction}
    renderSuggestion={(hit: any) => <PostsListEditorSearchHit hit={hit} />}
    placeholder={placeholder}
    noSearchPlaceholder='Post ID'
  />
}

export const PostsSearchAutoComplete = registerComponent("PostsSearchAutoComplete", PostsSearchAutoCompleteInner);



