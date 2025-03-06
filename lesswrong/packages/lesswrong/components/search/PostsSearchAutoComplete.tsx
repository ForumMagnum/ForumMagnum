import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components'
import { getSearchIndexName } from '../../lib/search/searchUtil';
import PostsListEditorSearchHit from "@/components/search/PostsListEditorSearchHit";
import SearchAutoComplete from "@/components/search/SearchAutoComplete";

const PostsSearchAutoComplete = ({clickAction, placeholder='Search for posts'}: {
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

const PostsSearchAutoCompleteComponent = registerComponent("PostsSearchAutoComplete", PostsSearchAutoComplete);

declare global {
  interface ComponentTypes {
    PostsSearchAutoComplete: typeof PostsSearchAutoCompleteComponent
  }
}

export default PostsSearchAutoCompleteComponent;

