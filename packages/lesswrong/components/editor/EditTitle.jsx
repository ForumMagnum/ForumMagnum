import { registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Textarea } from 'formsy-react-components';

const EditTitle = (props) => {
  return <Textarea
            className="posts-edit-header-title"
            name={ props.name }
            value={ props.value }
            placeholder={ props.placeholder }
            layout="elementOnly"
          />
}

registerComponent("EditTitle", EditTitle);
