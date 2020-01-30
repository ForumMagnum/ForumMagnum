import React, { Component } from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';

class FormComponentDefault extends Component {
  render() {
    return <Components.MuiTextField {...this.props} />
  }
}

const FormComponentDefaultComponent = registerComponent("FormComponentDefault", FormComponentDefault);

declare global {
  interface ComponentTypes {
    FormComponentDefault: typeof FormComponentDefaultComponent
  }
}

