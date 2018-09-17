import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import defineComponent from '../../lib/defineComponent';

const ComingSoon = (props, context) => {
  return <h1>Coming Soon!</h1>
};

export default defineComponent({
  name: 'ComingSoon',
  component: ComingSoon
});
