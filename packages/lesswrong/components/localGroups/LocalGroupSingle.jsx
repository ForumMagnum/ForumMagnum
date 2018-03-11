import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';

const LocalgroupSingle = (props) => {
  return <Components.LocalgroupPage documentId={props.params.groupId}/>
}

registerComponent('LocalgroupSingle', LocalgroupSingle);
