import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';

const SequencesHighlightsCollectionInner = () => {
  return <Components.CollectionsPage documentId={'62bf5f5dc581cd211cc67d49'} />
};

export const SequencesHighlightsCollection = registerComponent('SequencesHighlightsCollection', SequencesHighlightsCollectionInner);

declare global {
  interface ComponentTypes {
    SequencesHighlightsCollection: typeof SequencesHighlightsCollection
  }
}

