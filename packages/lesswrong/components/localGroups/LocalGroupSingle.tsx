import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';

const LocalGroupSingle = () => {
  const { params } = useLocation();
  return <Components.LocalGroupPage documentId={params.groupId}/>
}

const LocalGroupSingleComponent = registerComponent('LocalGroupSingle', LocalGroupSingle);

declare global {
  interface ComponentTypes {
    LocalGroupSingle: typeof LocalGroupSingleComponent
  }
}

