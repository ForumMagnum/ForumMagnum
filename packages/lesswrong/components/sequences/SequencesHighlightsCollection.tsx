import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';

const SequencesHighlightsCollection = () => {
  return <Components.CollectionsPage documentId={'62bf5f5dc581cd211cc67d49'} />
};

const SequencesHighlightsCollectionComponent = registerComponent('SequencesHighlightsCollection', SequencesHighlightsCollection);

declare global {
  interface ComponentTypes {
    SequencesHighlightsCollection: typeof SequencesHighlightsCollectionComponent
  }
}

