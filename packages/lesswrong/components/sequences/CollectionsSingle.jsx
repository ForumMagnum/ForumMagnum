import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import defineComponent from '../../lib/defineComponent';

const CollectionsSingle = (props, context) => {
  return <Components.CollectionsPage documentId={props.params._id} />
};

export default defineComponent({
  name: 'CollectionsSingle',
  component: CollectionsSingle
});
