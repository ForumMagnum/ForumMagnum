import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import mapValues from 'lodash/mapValues';

class FormComponentNumber extends PureComponent {

  getChildContext() {
    return {
      ...this.context,
      
      // For some reason MuiTextField with type="number" constrains the input
      // to a number, but then reports the result as a string, which causes
      // form validation to fail because strings like "3" are not nunbers.
      // Insert a mapping here to parse them first.
      updateCurrentValues: (changes) => {
        this.context.updateCurrentValues(mapValues(changes, n=>parseInt(n)));
      }
    };
  }
  
  render() {
    return <Components.MuiTextField
      type="number"
      {...this.props}
    />
  }
}

FormComponentNumber.contextTypes = {
  updateCurrentValues: PropTypes.func,
};
FormComponentNumber.childContextTypes = {
  updateCurrentValues: PropTypes.func,
};

// Replaces FormComponentNumber from vulcan-ui-bootstrap
registerComponent("FormComponentNumber", FormComponentNumber);

