import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core'
import { algoliaIndexNames } from '../../lib/algoliaUtil';

const SequencesSearchAutoComplete = ({clickAction}) => {
  return <Components.SearchAutoComplete
    indexName={algoliaIndexNames.Sequences}
    clickAction={clickAction}
    renderSuggestion={hit => <Components.SequencesSearchHit hit={hit} clickAction={clickAction} />}
    placeholder='Search for sequences'
    hitsPerPage={3}
    noSearchPlaceholder='Sequence ID'
  />
}

registerComponent("SequencesSearchAutoComplete", SequencesSearchAutoComplete);
