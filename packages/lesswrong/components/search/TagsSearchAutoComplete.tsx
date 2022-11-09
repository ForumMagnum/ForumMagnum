import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib'
import { getAlgoliaIndexName } from '../../lib/algoliaUtil';

const TagsSearchAutoComplete = ({clickAction, placeholder='Search for posts', hidePostCount=false}:{
  clickAction: any,
  placeholder?: string,
  hidePostCount?: boolean
}) => {
  return <Components.SearchAutoComplete
    indexName={getAlgoliaIndexName("Tags")}
    clickAction={clickAction}
    renderSuggestion={hit => <Components.TagSearchHit hit={hit} hidePostCount={hidePostCount} />}
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

