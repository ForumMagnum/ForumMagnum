import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';

const CollectionsSingle = () => {
  const { params } = useLocation();
  return <Components.CollectionsPage documentId={params._id} />
};

registerComponent('CollectionsSingle', CollectionsSingle);
