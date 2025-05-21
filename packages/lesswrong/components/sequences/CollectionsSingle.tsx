import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import CollectionsPage from "./CollectionsPage";

const CollectionsSingle = () => {
  const { params } = useLocation();
  return <CollectionsPage documentId={params._id} />
};

export default registerComponent('CollectionsSingle', CollectionsSingle);



