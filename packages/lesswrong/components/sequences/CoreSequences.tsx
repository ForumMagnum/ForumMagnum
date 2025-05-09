import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { CollectionsPage } from "./CollectionsPage";

const CoreSequencesInner = () => {
  return <CollectionsPage documentId={'oneQyj4pw77ynzwAF'} />
};

export const CoreSequences = registerComponent('CoreSequences', CoreSequencesInner);



