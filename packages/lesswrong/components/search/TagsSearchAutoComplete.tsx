import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib'
import { getAlgoliaIndexName } from '../../lib/algoliaUtil';

const TagsSearchAutoComplete = ({clickAction, placeholder='Search for posts', hidePostCount=false, filters}:{
  clickAction: (id: string, tag: AlgoliaTag | null) => void,
  placeholder?: string,
  hidePostCount?: boolean,
  filters?: string
}) => {
  return <Components.SearchAutoComplete
    indexName={getAlgoliaIndexName("Tags")}
    clickAction={clickAction}
    renderSuggestion={(hit: any) => <Components.TagSearchHit hit={hit} hidePostCount={hidePostCount} />}
    placeholder={placeholder}
    noSearchPlaceholder='Tag ID'
    filters={filters}
  />
}

const TagsSearchAutoCompleteComponent = registerComponent("TagsSearchAutoComplete", TagsSearchAutoComplete);

declare global {
  interface ComponentTypes {
    TagsSearchAutoComplete: typeof TagsSearchAutoCompleteComponent
  }
}

