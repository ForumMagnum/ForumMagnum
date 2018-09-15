import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import defineComponent from '../../lib/defineComponent';

const Codex = (props, context) => {
  return <Components.CollectionsPage documentId={'2izXHCrmJ684AnZ5X'} />
};

export default defineComponent({
  name: 'Codex',
  component: Codex
});
