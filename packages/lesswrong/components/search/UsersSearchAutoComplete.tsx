import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib'
import { getAlgoliaIndexName } from '../../lib/search/algoliaUtil';

const UsersSearchAutoComplete = ({clickAction, label}: {
  clickAction: (id: string) => void;
  label?: string;
}) => {
  return <Components.SearchAutoComplete
    indexName={getAlgoliaIndexName("Users")}
    clickAction={clickAction}
    renderSuggestion={(hit: AlgoliaUser) => <Components.UsersAutoCompleteHit document={hit} />}
    renderInputComponent={(inputProps: AnyBecauseHard) => <Components.UsersSearchInput inputProps={inputProps} />}
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

