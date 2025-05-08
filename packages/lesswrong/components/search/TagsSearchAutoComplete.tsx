import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components'
import { getSearchIndexName } from '../../lib/search/searchUtil';
import { SearchAutoComplete } from "./SearchAutoComplete";
import { TagSearchHit } from "../tagging/TagSearchHit";

const TagsSearchAutoCompleteInner = ({
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

export const TagsSearchAutoComplete = registerComponent("TagsSearchAutoComplete", TagsSearchAutoCompleteInner);

declare global {
  interface ComponentTypes {
    TagsSearchAutoComplete: typeof TagsSearchAutoComplete
  }
}

