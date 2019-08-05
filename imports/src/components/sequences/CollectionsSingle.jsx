import { Components, registerComponent } from 'vulcan:core';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';

const CollectionsSingle = () => {
  const { params } = useLocation();
  return <Components.CollectionsPage documentId={params._id} />
};

CollectionsSingle.displayName = "CollectionsSingle";

registerComponent('CollectionsSingle', CollectionsSingle);
