import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useFormComponentContext, LWForm } from './formUtil';
import Checkbox from '@material-ui/core/Checkbox';

export function FormCheckbox<T, FN extends keyof T>({form, fieldName, label}: {
  form: LWForm<T>,
  fieldName: NameOfFieldWithType<T,FN,boolean>,
  label: string,
}) {
  const {value,setValue} = useFormComponentContext<boolean,T>(form, fieldName);
  return <div>
    <Checkbox checked={value} onChange={(event) => {
      setValue(event.target.checked);
    }}/>
    {label}
   </div>
}

registerComponent('FormCheckbox', FormCheckbox);
declare global {
  interface ComponentTypes {
    FormCheckbox: typeof FormCheckbox
  }
}
