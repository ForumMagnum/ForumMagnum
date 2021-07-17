import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useFormComponentContext, LWForm } from './formUtil';

export function FormDate<T, FN extends keyof T>({form, fieldName, label}: {
  form: LWForm<T>,
  fieldName: NameOfFieldWithType<T,FN,Date>,
  label: string,
}) {
  const {value,setValue} = useFormComponentContext<boolean,T>(form, fieldName);
  return <div>
    {label}
    { /*TODO*/ }
   </div>
}

registerComponent('FormDate', FormDate);
declare global {
  interface ComponentTypes {
    FormDate: typeof FormDate
  }
}
