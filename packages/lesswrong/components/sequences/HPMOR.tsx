import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import CollectionsPage from "./CollectionsPage";

const HPMOR = () => {
  return <CollectionsPage documentId={'ywQvGBSojSQZTMpLh'} />
};

export default registerComponent('HPMOR', HPMOR);



