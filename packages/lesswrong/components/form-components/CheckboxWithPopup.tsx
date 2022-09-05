import React from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib"

const CheckboxWithPopup = (
  { label, disabled, path, value, updateCurrentValues }:
    { label: string, disabled?: boolean, path: string, value: boolean, updateCurrentValues: (values: any) => void},
) => {
  const { FormComponentCheckbox } = Components
  
  return <FormComponentCheckbox
    label={label}
    disabled={disabled}
    path={path}
    value={value}
    updateCurrentValues={updateCurrentValues}
  />
}

const CheckboxWithPopupComponent = registerComponent("CheckboxWithPopup", CheckboxWithPopup);

declare global {
  interface ComponentTypes {
    CheckboxWithPopup: typeof CheckboxWithPopupComponent
  }
}
