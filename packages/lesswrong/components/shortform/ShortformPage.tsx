import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

// Currently this page is a bit redundant with ShortformThreadList, but I expect to eventually use ShortformThreadList to also be user's shortform page
const ShortformPage = ({classes}: {
  classes: ClassesType,
}) => {
  return  <Components.ShortformThreadList />
}

const ShortformPageComponent = registerComponent('ShortformPage', ShortformPage);

declare global {
  interface ComponentTypes {
    ShortformPage: typeof ShortformPageComponent
  }
}

