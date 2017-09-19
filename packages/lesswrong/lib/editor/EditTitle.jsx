import { registerComponent } from 'meteor/vulcan:core';
import React, { PropTypes, Component } from 'react';
import { Textarea } from 'formsy-react-components';

const EditTitle = (props) => <Textarea
  className="posts-edit-header-title"
  {...props}
  layout="elementOnly"
/>

registerComponent("EditTitle", EditTitle);
