import React, {Component} from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import FlatButton from 'material-ui/FlatButton';


class SubmitButton extends Component {
  render() {
    const fieldName = this.props.name;
    console.log("props SubmitButton", this.props)
    return <FlatButton onTouchTap={this.context.updateCurrentValues({fieldName: true}, true)} label={this.props.name} />
  }
}

SubmitButton.contextTypes = {
  updateCurrentValues: React.PropTypes.func,
};

registerComponent("SubmitButton", SubmitButton);
