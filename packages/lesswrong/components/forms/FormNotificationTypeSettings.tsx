import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useFormComponentContext, LWForm } from './formUtil';

export function FormNotificationTypeSettings<T, FN extends keyof T>({form, fieldName, label}: {
  form: LWForm<T>,
  fieldName: NameOfFieldWithType<T,FN,string>,
  label: string,
}) {
  const {value,setValue} = useFormComponentContext<boolean,T>(form, fieldName);
  return <div>
    {label}
    { /*TODO*/ }
   </div>
}

registerComponent('FormNotificationTypeSettings', FormNotificationTypeSettings);
declare global {
  interface ComponentTypes {
    FormNotificationTypeSettings: typeof FormNotificationTypeSettings
  }
}
