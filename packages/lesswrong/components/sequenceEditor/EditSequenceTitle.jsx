import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { Textarea } from 'formsy-react-components';

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

registerComponent("EditSequenceTitle", EditSequenceTitle);
