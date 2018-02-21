import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core'
import { InstantSearch, Configure } from 'react-instantsearch/dom';
import { connectAutoComplete } from 'react-instantsearch/connectors';
import algoliaClient from 'algoliasearch/src/browser/builds/algoliasearch'
import Autosuggest from 'react-autosuggest';

const PostsSearchAutoComplete = ({clickAction, HitComponent}) =>
  <InstantSearch
    indexName="test_posts"
    algoliaClient={algoliaClient("Z0GR6EXQHD", "0b1d20b957917dbb5e1c2f3ad1d04ee2")}
  >
    <div className="posts-search-auto-complete">
      <AutoComplete clickAction={clickAction} />
      <Configure hitsPerPage={7} />
    </div>
  </InstantSearch>;

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
