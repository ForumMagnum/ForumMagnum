import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib'
import { getAlgoliaIndexName } from '../../lib/search/algoliaUtil';

const SequencesSearchAutoComplete = ({clickAction}: {
  clickAction: (id: string) => void
}) => {
  return <Components.SearchAutoComplete
    indexName={getAlgoliaIndexName("Sequences")}
    clickAction={clickAction}
    renderSuggestion={(hit: any) => <Components.SequencesSearchHit hit={hit} clickAction={clickAction} />}
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

