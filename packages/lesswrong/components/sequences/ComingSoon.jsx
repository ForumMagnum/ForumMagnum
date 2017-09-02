import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';

const ComingSoon = (props, context) => {
  return <h1>Coming Soon!</h1>
};

registerComponent('ComingSoon', ComingSoon);
