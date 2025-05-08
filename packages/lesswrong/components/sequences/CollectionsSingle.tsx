import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';

const CollectionsSingleInner = () => {
  const { params } = useLocation();
  return <Components.CollectionsPage documentId={params._id} />
};

export const CollectionsSingle = registerComponent('CollectionsSingle', CollectionsSingleInner);

declare global {
  interface ComponentTypes {
    CollectionsSingle: typeof CollectionsSingle
  }
}

