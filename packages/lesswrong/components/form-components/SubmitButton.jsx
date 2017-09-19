import React, {Component} from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import FlatButton from 'material-ui/FlatButton';


class SubmitButton extends Component {
  render() {
    const fieldName = this.props.name;
    return <FlatButton onTouchTap={() => this.context.updateCurrentValues({[fieldName]: true}, true)} label={this.props.label} />
  }
}

SubmitButton.contextTypes = {
  updateCurrentValues: React.PropTypes.func,
};

registerComponent("SubmitButton", SubmitButton);
