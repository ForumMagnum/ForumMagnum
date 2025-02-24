import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';

const CollectionsSingle = () => {
  const { params } = useLocation();
  return <Components.CollectionsPage documentId={params._id} />
};

const CollectionsSingleComponent = registerComponent('CollectionsSingle', CollectionsSingle);

declare global {
  interface ComponentTypes {
    CollectionsSingle: typeof CollectionsSingleComponent
  }
}

