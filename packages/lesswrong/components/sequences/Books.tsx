import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import CollectionsPage from "./CollectionsPage";

const Books = () => {
  return <CollectionsPage documentId={'nmk3nLpQE89dMRzzN'} />
};

export default registerComponent('Books', Books);



