import React, { Component } from 'react';
import { registerComponent, Components } from 'vulcan:core';

class FormComponentDefault extends Component {
  render() {
    return <Components.MuiTextField {...this.props} />
  }
}

registerComponent("FormComponentDefault", FormComponentDefault);
