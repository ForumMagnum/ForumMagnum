import { registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Textarea } from 'formsy-react-components';
import defineComponent from '../../lib/defineComponent';

const EditSequenceTitle = (props) => {
  return <div className="sequences-editor-banner">
    <div className="sequences-image-scrim-overlay"></div>
    <div className="sequences-editor-title-wrapper">
      <Textarea
        className="sequences-editor-title"
        {...props.inputProperties}
        placeholder={ props.placeholder }
        layout="elementOnly"
      />
    </div>
  </div>
}

export default defineComponent({
  name: "EditSequenceTitle",
  component: EditSequenceTitle
});
