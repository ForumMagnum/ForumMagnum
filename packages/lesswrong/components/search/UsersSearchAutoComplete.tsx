import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib'
import { algoliaIndexNames } from '../../lib/algoliaUtil';

const UsersSearchAutoComplete = ({clickAction, label}) => {
  return <Components.SearchAutoComplete
    indexName={algoliaIndexNames.Users}
    clickAction={clickAction}
    renderSuggestion={hit => <Components.UsersAutoCompleteHit document={hit} />}
    renderInputComponent={hit => <Components.UsersSearchInput inputProps={hit} />}
    placeholder={label || "Search for Users"}
    noSearchPlaceholder='User ID'
  />
}

const UsersSearchAutoCompleteComponent = registerComponent("UsersSearchAutoComplete", UsersSearchAutoComplete);

declare global {
  interface ComponentTypes {
    UsersSearchAutoComplete: typeof UsersSearchAutoCompleteComponent
  }
}

