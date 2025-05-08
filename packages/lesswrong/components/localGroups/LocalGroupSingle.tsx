import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';

const LocalGroupSingleInner = () => {
  const { params } = useLocation();
  return <Components.LocalGroupPage documentId={params.groupId}/>
}

export const LocalGroupSingle = registerComponent('LocalGroupSingle', LocalGroupSingleInner);

declare global {
  interface ComponentTypes {
    LocalGroupSingle: typeof LocalGroupSingle
  }
}

