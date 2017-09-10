import React, { PropTypes, Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { Checkbox } from 'formsy-react-components';

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

export default SaveDraftButton;
