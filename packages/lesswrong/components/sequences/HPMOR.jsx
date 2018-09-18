import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import defineComponent from '../../lib/defineComponent';

const HPMOR = (props, context) => {
  return <Components.CollectionsPage documentId={'ywQvGBSojSQZTMpLh'} />
};

export default defineComponent({
  name: 'HPMOR',
  component: HPMOR,
  register: false
});
