import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const FormComponentNumber = (props: FormComponentProps<number>) => {
  return <Components.MuiTextField
    type="number"
    {...props}
    value={""+props.value}
    updateCurrentValues={
      // MuiTextField returns a string - convert it into a number to avoid database errors
      (values: any, options?: any) => {
        for (const key in values) {
          values[key] = parseInt(values[key]);
        }
        return props.updateCurrentValues(values, options);
      }
    }
  />
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
