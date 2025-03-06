import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import MuiTextField from "@/components/form-components/MuiTextField";

const FormComponentDate = (props: FormComponentProps<string>) => {
  return <MuiTextField
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

export default FormComponentDateComponent;
