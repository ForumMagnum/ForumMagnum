import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components } from 'meteor/vulcan:core';
import FlatButton from 'material-ui/FlatButton';
import defineComponent from '../../lib/defineComponent';


class SubmitButton extends Component {
  render() {
    const fieldName = this.props.name;
    return <FlatButton onClick={() => this.context.updateCurrentValues({[fieldName]: true}, true)} label={this.props.label} />
  }
}

SubmitButton.contextTypes = {
  updateCurrentValues: PropTypes.func,
};

export default defineComponent({
  name: "SubmitButton",
  component: SubmitButton
});
