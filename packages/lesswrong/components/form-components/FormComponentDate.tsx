import React, { Component } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';

class FormComponentDate extends Component {
  render() {
    return <Components.MuiTextField
      {...this.props as any}
      InputLabelProps={{
        shrink: true,
      }}
      type="date"
    />
  }
}

const FormComponentDateComponent = registerComponent("FormComponentDate", FormComponentDate);

declare global {
  interface ComponentTypes {
    FormComponentDate: typeof FormComponentDateComponent
  }
}
