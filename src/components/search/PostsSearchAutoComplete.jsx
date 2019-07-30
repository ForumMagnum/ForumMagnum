import React from 'react';
import { registerComponent, Components, getSetting } from 'meteor/vulcan:core'
import { InstantSearch, Configure } from 'react-instantsearch-dom';
import { connectAutoComplete } from 'react-instantsearch/connectors';
import Autosuggest from 'react-autosuggest';
import { algoliaIndexNames } from '../../lib/algoliaIndexNames.js';

const PostsSearchAutoComplete = ({clickAction, HitComponent}) => {
  const algoliaAppId = getSetting('algolia.appId')
  const algoliaSearchKey = getSetting('algolia.searchKey')
  return <InstantSearch
    indexName={algoliaIndexNames.Posts}
    appId={algoliaAppId}
    apiKey={algoliaSearchKey}
         >
    <div className="posts-search-auto-complete">
      <AutoComplete clickAction={clickAction} />
      <Configure hitsPerPage={7} />
    </div>
  </InstantSearch>
}


const AutoComplete = connectAutoComplete(
  ({ hits, currentRefinement, refine, clickAction}) =>
  {
    const onSuggestionSelected = (event, { suggestion }) => {
      event.preventDefault();
      event.stopPropagation();
      clickAction(suggestion._id)
    }
    return (
      <Autosuggest
        suggestions={hits}
        onSuggestionSelected={onSuggestionSelected}
        onSuggestionsFetchRequested={({ value }) => refine(value)}
        onSuggestionsClearRequested={() => refine('')}
        getSuggestionValue={hit => hit.title}
        renderSuggestion={hit =>
          <Components.PostsListEditorSearchHit hit={hit} />}
        inputProps={{
          placeholder: 'Search for posts',
          value: currentRefinement,
          onChange: () => {},
        }}
        highlightFirstSuggestion
      />
    )
  }
);

registerComponent("PostsSearchAutoComplete", PostsSearchAutoComplete);
