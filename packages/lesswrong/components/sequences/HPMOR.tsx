import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';

const HPMORInner = () => {
  return <Components.CollectionsPage documentId={'ywQvGBSojSQZTMpLh'} />
};

export const HPMOR = registerComponent('HPMOR', HPMORInner);

declare global {
  interface ComponentTypes {
    HPMOR: typeof HPMOR
  }
}

