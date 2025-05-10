import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { CollectionsPage } from "./CollectionsPage";

const HPMORInner = () => {
  return <CollectionsPage documentId={'ywQvGBSojSQZTMpLh'} />
};

export const HPMOR = registerComponent('HPMOR', HPMORInner);



