import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components'
import { getSearchIndexName } from '../../lib/search/searchUtil';
import UsersSearchInput from "@/components/search/UsersSearchInput";
import UsersAutoCompleteHit from "@/components/search/UsersAutoCompleteHit";
import SearchAutoComplete from "@/components/search/SearchAutoComplete";

const UsersSearchAutoComplete = ({clickAction, label}: {
  clickAction: (id: string, result: SearchUser) => void;
  label?: string;
}) => {
  return <SearchAutoComplete
    indexName={getSearchIndexName("Users")}
    clickAction={clickAction}
    renderSuggestion={(hit: any) => <UsersAutoCompleteHit document={hit} />}
    renderInputComponent={(hit: any) => <UsersSearchInput inputProps={hit} />}
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

export default UsersSearchAutoCompleteComponent;

