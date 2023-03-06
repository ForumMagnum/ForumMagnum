import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib'
import { getAlgoliaIndexName } from '../../lib/algoliaUtil';

const TagsSearchAutoComplete = ({clickAction, placeholder='Search for posts', hidePostCount=false, isVotingContext}:{
  clickAction: (id: string, tag: AlgoliaTag | null) => void,
  placeholder?: string,
  hidePostCount?: boolean,
  isVotingContext?: boolean
}) => {
  return <Components.SearchAutoComplete
    indexName={getAlgoliaIndexName("Tags")}
    clickAction={clickAction}
    renderSuggestion={(hit: any) => <Components.TagSearchHit hit={hit} hidePostCount={hidePostCount} isVotingContext={isVotingContext} />}
    placeholder={placeholder}
    noSearchPlaceholder='Tag ID'
  />
}

const TagsSearchAutoCompleteComponent = registerComponent("TagsSearchAutoComplete", TagsSearchAutoComplete);

declare global {
  interface ComponentTypes {
    TagsSearchAutoComplete: typeof TagsSearchAutoCompleteComponent
  }
}

