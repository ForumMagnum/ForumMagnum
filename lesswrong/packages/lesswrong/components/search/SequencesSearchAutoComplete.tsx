import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components'
import { getSearchIndexName } from '../../lib/search/searchUtil';
import SequencesSearchHit from "@/components/search/SequencesSearchHit";
import SearchAutoComplete from "@/components/search/SearchAutoComplete";

const SequencesSearchAutoComplete = ({clickAction}: {
  clickAction: (id: string) => void
}) => {
  return <SearchAutoComplete
    indexName={getSearchIndexName("Sequences")}
    clickAction={clickAction}
    renderSuggestion={(hit: any) => <SequencesSearchHit hit={hit} clickAction={clickAction} />}
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

export default SequencesSearchAutoCompleteComponent;

