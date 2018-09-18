import { Components } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import defineComponent from '../../lib/defineComponent';
import LocalGroupPage from './LocalGroupPage'

const LocalGroupSingle = (props) => {
  return <LocalGroupPage documentId={props.params.groupId}/>
}

export default defineComponent({
  name: 'LocalGroupSingle',
  component: LocalGroupSingle,
  register: false
});
