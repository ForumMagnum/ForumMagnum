import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib'
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

const SequencesSearchAutoCompleteComponent = registerComponent("SequencesSearchAutoComplete", SequencesSearchAutoComplete);

declare global {
  interface ComponentTypes {
    SequencesSearchAutoComplete: typeof SequencesSearchAutoCompleteComponent
  }
}

