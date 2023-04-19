import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const FormComponentDate = (props: FormComponentProps<string>) => {
  return <Components.MuiTextField
    {...props}
    InputLabelProps={{
      shrink: true,
    }}
    type="date"
  />
}

const FormComponentDateComponent = registerComponent("FormComponentDate", FormComponentDate);

declare global {
  interface ComponentTypes {
    FormComponentDate: typeof FormComponentDateComponent
  }
}
