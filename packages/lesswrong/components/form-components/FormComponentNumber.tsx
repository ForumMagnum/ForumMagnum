import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import mapValues from 'lodash/mapValues';

class FormComponentNumber extends PureComponent<any> {

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
      {...this.props as any}
    />
  }
}

(FormComponentNumber as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
};
(FormComponentNumber as any).childContextTypes = {
  updateCurrentValues: PropTypes.func,
};

// Replaces FormComponentNumber from vulcan-ui-bootstrap
const FormComponentNumberComponent = registerComponent("FormComponentNumber", FormComponentNumber);

declare global {
  interface ComponentTypes {
    FormComponentNumber: typeof FormComponentNumberComponent
  }
}
