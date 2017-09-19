import React, { PropTypes, Component } from 'react';
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
        <Checkbox {...this.props} />
      </div>
    )
  }
}

SaveDraftButton.contextTypes = {
  addToAutofilledValues: React.PropTypes.func,
  addToSuccessForm: React.PropTypes.func,
  addToSubmitForm: React.PropTypes.func,
};

registerComponent("SaveDraftButton", SaveDraftButton);
