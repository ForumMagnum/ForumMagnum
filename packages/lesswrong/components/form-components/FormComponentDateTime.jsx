import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';

class FormComponentDateTime extends Component {
  render() {
    return <Components.MuiTextField
      {...this.props}
      placeholder={this.props.label}
      InputLabelProps={{
        shrink: true,
      }}
      type="datetime-local"
    />
  }
}

registerComponent("FormComponentDateTime", FormComponentDateTime);
