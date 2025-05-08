import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';

const CoreSequencesInner = () => {
  return <Components.CollectionsPage documentId={'oneQyj4pw77ynzwAF'} />
};

export const CoreSequences = registerComponent('CoreSequences', CoreSequencesInner);

declare global {
  interface ComponentTypes {
    CoreSequences: typeof CoreSequences
  }
}

