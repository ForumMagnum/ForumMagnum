import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components'
import { getSearchIndexName } from '../../lib/search/searchUtil';
import { SearchAutoComplete } from "./SearchAutoComplete";
import { UsersAutoCompleteHit } from "./UsersAutoCompleteHit";
import { UsersSearchInput } from "./UsersSearchInput";

const UsersSearchAutoCompleteInner = ({clickAction, label}: {
  clickAction: (id: string, result: SearchUser) => void;
  label?: string;
}) => {
  return <SearchAutoComplete
    indexName={getSearchIndexName("Users")}
    clickAction={clickAction}
    renderSuggestion={(hit: any) => <UsersAutoCompleteHit document={hit} />}
    renderInputComponent={(inputProps: any) => <UsersSearchInput inputProps={inputProps} />}
    placeholder={label || "Search for Users"}
    noSearchPlaceholder='User ID'
  />
}

export const UsersSearchAutoComplete = registerComponent("UsersSearchAutoComplete", UsersSearchAutoCompleteInner);



