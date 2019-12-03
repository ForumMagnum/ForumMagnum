import React from 'react';
import { registerComponent, Components, getSetting } from 'meteor/vulcan:core'
import { InstantSearch } from 'react-instantsearch-dom';
import { algoliaIndexNames } from '../../lib/algoliaIndexNames.js';

const SequencesSearchAutoComplete = ({clickAction}) => {
  const algoliaAppId = getSetting('algolia.appId')
  const algoliaSearchKey = getSetting('algolia.searchKey')
  return <InstantSearch
    indexName={algoliaIndexNames.Sequences}
    appId={algoliaAppId}
    apiKey={algoliaSearchKey}
  >
    <Components.SearchAutoComplete
      clickAction={clickAction}
      renderSuggestion={hit => <Components.SequencesSearchHit hit={hit} clickAction={clickAction} />}
      placeholder='Search for sequences'
      hitsPerPage={3}
    />
  </InstantSearch>
}

registerComponent("SequencesSearchAutoComplete", SequencesSearchAutoComplete);
