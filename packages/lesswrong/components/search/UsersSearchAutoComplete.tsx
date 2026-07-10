import React from 'react';
import { getSearchIndexName } from '../../lib/search/searchUtil';
import SearchAutoComplete from "./SearchAutoComplete";
import UsersAutoCompleteHit from "./UsersAutoCompleteHit";
import UsersSearchInput from "./UsersSearchInput";

const UsersSearchAutoComplete = ({clickAction, label}: {
  clickAction: (id: string, result: SearchUser) => void;
  label?: string;
}) => {
  return <SearchAutoComplete
    indexName={getSearchIndexName("Users")}
    resultType="Users"
    clickAction={clickAction}
    renderSuggestion={(hit: any) => <UsersAutoCompleteHit key={hit._id} document={hit} />}
    renderInputComponent={({key, ...otherProps}: any) => <UsersSearchInput key={key || "users-search-input"} inputProps={otherProps} />}
    placeholder={label || "Search for Users"}
    noSearchPlaceholder='User ID'
  />
}

export default UsersSearchAutoComplete;



