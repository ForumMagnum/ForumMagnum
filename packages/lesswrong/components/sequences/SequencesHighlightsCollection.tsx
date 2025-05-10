import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { CollectionsPage } from "./CollectionsPage";

const SequencesHighlightsCollectionInner = () => {
  return <CollectionsPage documentId={'62bf5f5dc581cd211cc67d49'} />
};

export const SequencesHighlightsCollection = registerComponent('SequencesHighlightsCollection', SequencesHighlightsCollectionInner);



