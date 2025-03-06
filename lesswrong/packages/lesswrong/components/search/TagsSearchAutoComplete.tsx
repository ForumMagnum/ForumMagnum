import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components'
import { getSearchIndexName } from '../../lib/search/searchUtil';
import TagSearchHit from "@/components/tagging/TagSearchHit";
import SearchAutoComplete from "@/components/search/SearchAutoComplete";

const TagsSearchAutoComplete = ({
  clickAction,
  placeholder='Search for posts',
  hidePostCount=false,
  facetFilters,
  isVotingContext,
}: {
  clickAction: (id: string, tag: SearchTag | null) => void,
  placeholder?: string,
  hidePostCount?: boolean,
  facetFilters?: Record<string, boolean>,
  isVotingContext?: boolean
}) => {
  return <SearchAutoComplete
    indexName={getSearchIndexName("Tags")}
    clickAction={clickAction}
    renderSuggestion={(hit: any) => <TagSearchHit hit={hit} hidePostCount={hidePostCount} isVotingContext={isVotingContext} />}
    placeholder={placeholder}
    noSearchPlaceholder='Tag ID'
    facetFilters={facetFilters}
  />
}

const TagsSearchAutoCompleteComponent = registerComponent("TagsSearchAutoComplete", TagsSearchAutoComplete);

declare global {
  interface ComponentTypes {
    TagsSearchAutoComplete: typeof TagsSearchAutoCompleteComponent
  }
}

export default TagsSearchAutoCompleteComponent;

