import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import MenuItem from '@material-ui/core/MenuItem';

const FormComponentSelect = (props: any) => {
  const { form, options } = props

  const selectOptions = options || (form && form.options)

  return <Components.MuiTextField select {...props}>
    {selectOptions.map(option => (
      <MenuItem key={option.value} value={option.value}>
        {option.label}
      </MenuItem>
    ))}
  </Components.MuiTextField>
}

const FormComponentSelectComponent = registerComponent("FormComponentSelect", FormComponentSelect);

declare global {
  interface ComponentTypes {
    FormComponentSelect: typeof FormComponentSelectComponent
  }
}

