import { registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Textarea } from 'formsy-react-components';

const EditSequenceTitle = (props) => {
  return <div className="sequences-editor-banner">
    <div className="sequences-image-scrim-overlay"></div>
    <div className="sequences-editor-title-wrapper">
      <Textarea
        className="sequences-editor-title"
        name={ props.name }
        value={ props.value }
        placeholder={ props.placeholder }
        layout="elementOnly"
      />
    </div>
  </div>
}

registerComponent("EditSequenceTitle", EditSequenceTitle);
