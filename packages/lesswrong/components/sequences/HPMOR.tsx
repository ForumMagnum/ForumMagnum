import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';

// EXERCISE5: This component corresponds to a page.
//   (1) What URL is that page at? Change it to be /hpmor.
//   (2) This page has a typo in the page title. Fix it.

const HPMOR = () => {
  return <Components.CollectionsPage documentId={'ywQvGBSojSQZTMpLh'} />
};

const HPMORComponent = registerComponent('HPMOR', HPMOR);

declare global {
  interface ComponentTypes {
    HPMOR: typeof HPMORComponent
  }
}

