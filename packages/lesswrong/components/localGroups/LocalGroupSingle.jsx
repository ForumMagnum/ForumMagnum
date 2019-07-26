import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';

const LocalGroupSingle = () => {
  const { params } = useLocation();
  return <Components.LocalGroupPage documentId={params.groupId}/>
}

registerComponent('LocalGroupSingle', LocalGroupSingle);
