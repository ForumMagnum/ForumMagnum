import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from '../../lib/vulcan-lib';

class FormComponentNumber extends PureComponent<any> {
  render() {
    return <Components.MuiTextField
      type="number"
      {...this.props as any}
      updateCurrentValues={
        // MuiTextField returns a string - convert it into a number to avoid database errors
        (values: any[]) => {
          for (const key in values) {
            values[key] = parseInt(values[key]);
          }
          this.props.updateCurrentValues(values);
        }
      }
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
