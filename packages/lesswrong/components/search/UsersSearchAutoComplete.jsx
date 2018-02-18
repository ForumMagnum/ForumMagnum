import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core'
import { InstantSearch, Configure } from 'react-instantsearch/dom';
import { connectAutoComplete } from 'react-instantsearch/connectors';
import algoliaClient from 'algoliasearch/src/browser/builds/algoliasearch'
import Autosuggest from 'react-autosuggest';

const UsersSearchAutoComplete = ({clickAction}) =>
  <InstantSearch
    indexName="test_users"
    algoliaClient={algoliaClient("Z0GR6EXQHD", "0b1d20b957917dbb5e1c2f3ad1d04ee2")}
  >
    <div className="users-search-auto-complete">
      <AutoComplete clickAction={clickAction}/>
      <Configure hitsPerPage={7} />
    </div>
  </InstantSearch>;

const AutoComplete = connectAutoComplete(
  ({ hits, currentRefinement, refine, clickAction }) =>
  {
    const onSuggestionSelected = (event, { suggestion }) => {
      event.preventDefault();
      event.stopPropagation();
      clickAction(suggestion.objectID)
    }
    return <div className="users-search-auto-complete">
      <Autosuggest
        suggestions={hits}
        onSuggestionsFetchRequested={({ value }) => refine(value)}
        onSuggestionsClearRequested={() => refine('')}
        getSuggestionValue={hit => hit.title}
        onSuggestionSelected={onSuggestionSelected}
        renderSuggestion={hit =>
          <Components.UsersAutoCompleteHit document={hit} />}
        inputProps={{
          placeholder: 'Search for users',
          value: currentRefinement,
          onChange: () => {},
        }}
        highlightFirstSuggestion
      />
    </div>
  }

);

registerComponent("UsersSearchAutoComplete", UsersSearchAutoComplete);
