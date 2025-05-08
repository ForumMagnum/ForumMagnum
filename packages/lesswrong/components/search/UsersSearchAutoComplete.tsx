import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components'
import { getSearchIndexName } from '../../lib/search/searchUtil';

const UsersSearchAutoCompleteInner = ({clickAction, label}: {
  clickAction: (id: string, result: SearchUser) => void;
  label?: string;
}) => {
  return <Components.SearchAutoComplete
    indexName={getSearchIndexName("Users")}
    clickAction={clickAction}
    renderSuggestion={(hit: any) => <Components.UsersAutoCompleteHit document={hit} />}
    renderInputComponent={(hit: any) => <Components.UsersSearchInput inputProps={hit} />}
    placeholder={label || "Search for Users"}
    noSearchPlaceholder='User ID'
  />
}

export const UsersSearchAutoComplete = registerComponent("UsersSearchAutoComplete", UsersSearchAutoCompleteInner);

declare global {
  interface ComponentTypes {
    UsersSearchAutoComplete: typeof UsersSearchAutoComplete
  }
}

