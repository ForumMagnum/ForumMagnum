import React, { Component } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';

class FormComponentDefault extends Component {
  render() {
    return <Components.MuiTextField {...this.props as any} />
  }
}

const FormComponentDefaultComponent = registerComponent("FormComponentDefault", FormComponentDefault);

declare global {
  interface ComponentTypes {
    FormComponentDefault: typeof FormComponentDefaultComponent
  }
}
