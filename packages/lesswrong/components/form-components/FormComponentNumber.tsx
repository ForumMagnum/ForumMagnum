import React from 'react';
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

// Replaces FormComponentNumber from vulcan-ui-bootstrap
const FormComponentNumberComponent = registerComponent("FormComponentNumber", FormComponentNumber);

declare global {
  interface ComponentTypes {
    FormComponentNumber: typeof FormComponentNumberComponent
  }
}
