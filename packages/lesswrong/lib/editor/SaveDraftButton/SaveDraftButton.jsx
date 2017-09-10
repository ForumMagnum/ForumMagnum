import React, { PropTypes, Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import FlatButton from 'material-ui/FlatButton';
import { Checkbox } from 'formsy-react-components';

class SaveDraftButton extends Component {
  constructor(props, context) {
    super(props,context);
    const document = this.props.document;
    const fieldName = this.props.name;
        
    this.state = {
      active: false,
    };
  }

  toggleEditor = () => {this.setState({active: !this.state.active})}
    
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
