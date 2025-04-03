import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';

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
