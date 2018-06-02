import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { Checkbox } from 'formsy-react-components';

// Ray 20017-09-09: This component is currently mostly unnecessary but is planned to turn into a real "submit" button
// i.e click to submit and safe-to-draft

class SaveDraftButton extends Component {
  constructor(props, context) {
    super(props,context);
  }

  render() {
    return (
      <div className="posts-save-draft">
        <Checkbox name={this.props.name}
                  value={this.props.value}
                  placeholder={this.props.placeholder}
                  label={this.props.label} />
      </div>
    )
  }
}

SaveDraftButton.contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
  addToSubmitForm: PropTypes.func,
};

registerComponent("SaveDraftButton", SaveDraftButton);
