import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';

const LocalGroupSingle = ({ match: { params }}) => {
  return <Components.LocalGroupPage documentId={params.groupId}/>
}

registerComponent('LocalGroupSingle', LocalGroupSingle);
