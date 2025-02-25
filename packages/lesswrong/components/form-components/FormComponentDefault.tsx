import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';

const FormComponentDefault = (props: FormComponentProps<string>) => {
  return <Components.MuiTextField {...props} />
}

const FormComponentDefaultComponent = registerComponent("FormComponentDefault", FormComponentDefault);

declare global {
  interface ComponentTypes {
    FormComponentDefault: typeof FormComponentDefaultComponent
  }
}
