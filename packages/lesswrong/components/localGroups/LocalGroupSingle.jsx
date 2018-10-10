import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';

const LocalGroupSingle = (props) => {
  return <Components.LocalGroupPage documentId={props.params.groupId}/>
}

registerComponent('LocalGroupSingle', LocalGroupSingle);
