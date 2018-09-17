import { Components } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import defineComponent from '../../lib/defineComponent';

const LocalGroupSingle = (props) => {
  return <Components.LocalGroupPage documentId={props.params.groupId}/>
}

export default defineComponent({
  name: 'LocalGroupSingle',
  component: LocalGroupSingle
});
