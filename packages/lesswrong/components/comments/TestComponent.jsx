import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';

const TestComponent = (props, context) => {

  return (
    <div className="recent-comments-page">
      <div> This is some text! </div>
    </div>
  )
};

export default TestComponent
