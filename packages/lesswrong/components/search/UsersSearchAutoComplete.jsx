import React from 'react';
import { registerComponent, Components, getSetting } from 'meteor/vulcan:core'
import { InstantSearch, Configure } from 'react-instantsearch-dom';
import { connectAutoComplete } from 'react-instantsearch/connectors';
import Autosuggest from 'react-autosuggest';
import { algoliaIndexNames } from '../../lib/algoliaIndexNames.js';

const UsersSearchAutoComplete = ({clickAction, label}) => {
  const algoliaAppId = getSetting('algolia.appId')
  const algoliaSearchKey = getSetting('algolia.searchKey')

  if(!algoliaAppId) {
    return <div>User search is disabled (Algolia App ID not configured on server)</div>
  }

  return <InstantSearch
    indexName={algoliaIndexNames.Users}
    appId={algoliaAppId}
    apiKey={algoliaSearchKey}
  >
    <div>
      <AutoComplete clickAction={clickAction} label={label}/>
      <Configure hitsPerPage={7} />
    </div>
  </InstantSearch>
}

const AutoComplete = connectAutoComplete(
  ({ hits, currentRefinement, refine, clickAction, label }) =>
  {
    const onSuggestionSelected = (event, { suggestion }) => {
      event.preventDefault();
      event.stopPropagation();
      clickAction(suggestion.objectID)
    }
    return <span>
      <Autosuggest
        suggestions={hits}
        onSuggestionsFetchRequested={({ value }) => refine(value)}
        onSuggestionsClearRequested={() => refine('')}
        getSuggestionValue={hit => hit.title}
        onSuggestionSelected={onSuggestionSelected}
        renderInputComponent={hit => <Components.UsersSearchInput inputProps={hit}/>}
        renderSuggestion={hit =>
          <Components.UsersAutoCompleteHit document={hit} />}
        inputProps={{
          placeholder: label || "Search for Users",
          value: currentRefinement,
          onChange: () => {},
        }}
        highlightFirstSuggestion
      />
    </span>
  }

);

registerComponent("UsersSearchAutoComplete", UsersSearchAutoComplete);
