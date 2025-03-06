import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import CollectionsPage from "@/components/sequences/CollectionsPage";

const HPMOR = () => {
  return <CollectionsPage documentId={'ywQvGBSojSQZTMpLh'} />
};

const HPMORComponent = registerComponent('HPMOR', HPMOR);

declare global {
  interface ComponentTypes {
    HPMOR: typeof HPMORComponent
  }
}

export default HPMORComponent;

