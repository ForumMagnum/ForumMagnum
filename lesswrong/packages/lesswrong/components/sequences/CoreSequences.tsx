import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import CollectionsPage from "@/components/sequences/CollectionsPage";

const CoreSequences = () => {
  return <CollectionsPage documentId={'oneQyj4pw77ynzwAF'} />
};

const CoreSequencesComponent = registerComponent('CoreSequences', CoreSequences);

declare global {
  interface ComponentTypes {
    CoreSequences: typeof CoreSequencesComponent
  }
}

export default CoreSequencesComponent;

