import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components'
import { getSearchIndexName } from '../../lib/search/searchUtil';

const SequencesSearchAutoComplete = ({clickAction}: {
  clickAction: (id: string) => void
}) => {
  return <Components.SearchAutoComplete
    indexName={getSearchIndexName("Sequences")}
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

