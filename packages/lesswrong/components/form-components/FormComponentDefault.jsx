import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';

class FormComponentDefault extends Component {
  render() {
    return <Components.MuiTextField {...this.props} />
  }
}

// Replaces FormComponentDefault from vulcan-ui-bootstrap.
// TODO: This may not work right in nested contexts.
registerComponent("FormComponentDefault", FormComponentDefault);
