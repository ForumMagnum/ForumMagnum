import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { MenuItem } from "@/components/common/Menus";
import MuiTextField from "@/components/form-components/MuiTextField";

const FormComponentSelect = (props: FormComponentProps<string> & {
  form: any
  options: any
}) => {
  const { form, options } = props
  const selectOptions = options || (form && form.options)

  return <MuiTextField select {...props}>
    {selectOptions.map((option: AnyBecauseTodo) => (
      <MenuItem key={option.value} value={option.value}>
        {option.label}
      </MenuItem>
    ))}
  </MuiTextField>
}

const FormComponentSelectComponent = registerComponent("FormComponentSelect", FormComponentSelect);

declare global {
  interface ComponentTypes {
    FormComponentSelect: typeof FormComponentSelectComponent
  }
}

export default FormComponentSelectComponent;
