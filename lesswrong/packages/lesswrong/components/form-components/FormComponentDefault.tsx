import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import MuiTextField from "@/components/form-components/MuiTextField";

const FormComponentDefault = (props: FormComponentProps<string>) => {
  return <MuiTextField {...props} />
}

const FormComponentDefaultComponent = registerComponent("FormComponentDefault", FormComponentDefault);

declare global {
  interface ComponentTypes {
    FormComponentDefault: typeof FormComponentDefaultComponent
  }
}

export default FormComponentDefaultComponent;
