import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';

const HPMOR = () => {
  return <Components.CollectionsPage documentId={'ywQvGBSojSQZTMpLh'} />
};

const HPMORComponent = registerComponent('HPMOR', HPMOR);

declare global {
  interface ComponentTypes {
    HPMOR: typeof HPMORComponent
  }
}

