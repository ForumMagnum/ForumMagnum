import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useFormComponentContext, LWForm } from './formUtil';

export function FormDropdown<T, FN extends keyof T>({form, fieldName, label}: {
  form: LWForm<T>,
  fieldName: NameOfFieldWithType<T,FN,string>,
  label: string,
}) {
  const {value,setValue} = useFormComponentContext<string,T>(form, fieldName);
  return <div>
    {label}
   </div>
}

registerComponent('FormDropdown', FormDropdown);
declare global {
  interface ComponentTypes {
    FormDropdown: typeof FormDropdown
  }
}

