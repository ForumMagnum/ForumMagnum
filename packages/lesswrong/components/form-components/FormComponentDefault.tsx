import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const FormComponentDefault = (props: FormComponentProps<string>) => {
  return <Components.MuiTextField {...props} />
}

const FormComponentDefaultComponent = registerComponent("FormComponentDefault", FormComponentDefault);

declare global {
  interface ComponentTypes {
    FormComponentDefault: typeof FormComponentDefaultComponent
  }
}
