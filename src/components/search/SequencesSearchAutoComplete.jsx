import React from 'react';
import { registerComponent, Components, getSetting } from 'meteor/vulcan:core'
import { InstantSearch, Configure } from 'react-instantsearch-dom';
import { connectAutoComplete } from 'react-instantsearch/connectors';
import Autosuggest from 'react-autosuggest';
import { algoliaIndexNames } from '../../lib/algoliaIndexNames.js';

const SequencesSearchAutoComplete = ({clickAction}) => {
  const algoliaAppId = getSetting('algolia.appId')
  const algoliaSearchKey = getSetting('algolia.searchKey')
  return <InstantSearch
    indexName={algoliaIndexNames.Sequences}
    appId={algoliaAppId}
    apiKey={algoliaSearchKey}
         >
    <div className="posts-search-auto-complete">
      <AutoComplete clickAction={clickAction}/>
      <Configure hitsPerPage={3} />
    </div>
  </InstantSearch>
}


const AutoComplete = connectAutoComplete(
  ({ hits, currentRefinement, refine, clickAction }) =>
    <Autosuggest
      suggestions={hits}
      onSuggestionsFetchRequested={({ value }) => refine(value)}
      onSuggestionsClearRequested={() => refine('')}
      getSuggestionValue={hit => hit.title}
      renderSuggestion={hit =>
        <Components.SequencesSearchHit hit={hit} clickAction={clickAction} />}
      inputProps={{
        placeholder: 'Search for sequences',
        value: currentRefinement,
        onChange: () => {},
      }}
      highlightFirstSuggestion
    />
);

registerComponent("SequencesSearchAutoComplete", SequencesSearchAutoComplete);
