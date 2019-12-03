import React from 'react';
import { registerComponent, Components, getSetting } from 'meteor/vulcan:core'
import { InstantSearch, Configure } from 'react-instantsearch-dom';
import { connectAutoComplete } from 'react-instantsearch/connectors';
import Autosuggest from 'react-autosuggest';

const SearchAutoComplete = connectAutoComplete(
  ({ hits, currentRefinement, refine, clickAction, placeholder, renderSuggestion, hitsPerPage=7, indexName }) =>
  {
    const algoliaAppId = getSetting('algolia.appId')
    const algoliaSearchKey = getSetting('algolia.searchKey')
    
    const onSuggestionSelected = (event, { suggestion }) => {
      event.preventDefault();
      event.stopPropagation();
      clickAction(suggestion._id)
    }
    return <InstantSearch
      indexName={indexName}
      appId={algoliaAppId}
      apiKey={algoliaSearchKey}
    >
      <div className="posts-search-auto-complete">
        <Autosuggest
          suggestions={hits}
          onSuggestionSelected={(event, {suggestion}) => {
            event.preventDefault();
            event.stopPropagation();
            onSuggestionSelected(suggestion);
          }}
          onSuggestionsFetchRequested={({ value }) => refine(value)}
          onSuggestionsClearRequested={() => refine('')}
          getSuggestionValue={hit => hit.title}
          renderSuggestion={renderSuggestion}
          inputProps={{
            placeholder: placeholder,
            value: currentRefinement,
            onChange: () => {},
          }}
          highlightFirstSuggestion
        />
        <Configure hitsPerPage={hitsPerPage} />
      </div>
    </InstantSearch>
  }
);

registerComponent("SearchAutoComplete", SearchAutoComplete);
