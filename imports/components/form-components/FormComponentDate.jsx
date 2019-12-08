import React, { Component } from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';

class FormComponentDate extends Component {
  render() {
    return <Components.MuiTextField
      {...this.props}
      InputLabelProps={{
        shrink: true,
      }}
      type="date"
    />
  }
}

registerComponent("FormComponentDate", FormComponentDate);
