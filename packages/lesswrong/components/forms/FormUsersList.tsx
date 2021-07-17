import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useFormComponentContext, LWForm } from './formUtil';

export function FormUsersList<T, FN extends keyof T>({form, fieldName, label}: {
  form: LWForm<T>,
  fieldName: NameOfFieldWithType<T,FN,string[]>,
  label: string,
}) {
  const {value,setValue} = useFormComponentContext<boolean,T>(form, fieldName);
  return <div>
    {label}
    { /*TODO*/ }
   </div>
}

registerComponent('FormUsersList', FormUsersList);
declare global {
  interface ComponentTypes {
    FormUsersList: typeof FormUsersList
  }
}
