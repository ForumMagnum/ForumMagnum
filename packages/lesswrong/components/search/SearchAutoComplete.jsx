import React from 'react';
import { registerComponent, Components, getSetting } from 'meteor/vulcan:core'
import { InstantSearch, Configure } from 'react-instantsearch-dom';
import { connectAutoComplete } from 'react-instantsearch/connectors';
import Autosuggest from 'react-autosuggest';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  autoComplete: {
    "& li": {
      listStyle: "none",
    },
    "& .react-autosuggest__suggestion--highlighted": {
        backgroundColor: "rgba(0,0,0,0.05)",
    },
    "& ul": {
      marginLeft: 0,
      paddingLeft: 0,
    },
  }
});

const SearchAutoComplete = ({ clickAction, placeholder, renderSuggestion, hitsPerPage=7, indexName, classes, renderInputComponent }) => {
  const algoliaAppId = getSetting('algolia.appId')
  const algoliaSearchKey = getSetting('algolia.searchKey')
  
  if (!algoliaAppId || !algoliaSearchKey) {
    // Fallback for when Algolia is unavailable (ie, local development installs).
    // This isn't a particularly nice UI, but it's functional enough to be able
    // to test other things.
    return <input type="text" placeholder={placeholder} onKeyPress={ev => {
      if (ev.charCode===13) {
        const id = ev.target.value;
        clickAction(id);
        ev.preventDefault();
      }
    }}/>;
  }
  
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
    <div className={classes.autoComplete}>
      <AutocompleteTextbox onSuggestionSelected={onSuggestionSelected} placeholder={placeholder} renderSuggestion={renderSuggestion} renderInputComponent={renderInputComponent}/>
      <Configure hitsPerPage={hitsPerPage} />
    </div>
  </InstantSearch>
}

const AutocompleteTextbox = connectAutoComplete(
  ({
    // From connectAutoComplete HoC
    hits, currentRefinement, refine,
    // FromSearchAutoComplete
    onSuggestionSelected, placeholder, renderSuggestion, renderInputComponent
  }) => {
    return (
      <Autosuggest
        suggestions={hits}
        onSuggestionSelected={onSuggestionSelected}
        onSuggestionsFetchRequested={({ value }) => refine(value)}
        onSuggestionsClearRequested={() => refine('')}
        getSuggestionValue={hit => hit.title}
        renderInputComponent={renderInputComponent}
        renderSuggestion={renderSuggestion}
        inputProps={{
          placeholder: placeholder,
          value: currentRefinement,
          onChange: () => {},
        }}
        highlightFirstSuggestion
      />
    );
  }
);

registerComponent("SearchAutoComplete", SearchAutoComplete,
  withStyles(styles, {name: "SearchAutoComplete"}));
