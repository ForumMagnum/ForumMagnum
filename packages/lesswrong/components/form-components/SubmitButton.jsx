import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from 'meteor/vulcan:core';
import Button from '@material-ui/core/Button';


class SubmitButton extends Component {
  render() {
    const fieldName = this.props.name;
    return (<Button onClick={() => this.context.updateCurrentValues({[fieldName]: true}, true)}>
      {this.props.label}
    </Button>);
  }
}

SubmitButton.contextTypes = {
  updateCurrentValues: PropTypes.func,
};

// TODO: Figure out whether this component is actually being used. (It has no
// references in Lesswrong2 or Vulcan, but might be used by some library that
// vulcan-forms uses.)
registerComponent("SubmitButton", SubmitButton);
