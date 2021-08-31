import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useFormComponentContext, LWForm } from './formUtil';

export function FormKarmaChangeNotifierSettings<T, FN extends keyof T>({form, fieldName}: {
  form: LWForm<T>,
  fieldName: NameOfFieldWithType<T,FN,string>,
}) {
  const {value,setValue} = useFormComponentContext<boolean,T>(form, fieldName);
  return <div>
    Karma change notifier settings
    { /*TODO*/ }
   </div>
}

registerComponent('FormKarmaChangeNotifierSettings', FormKarmaChangeNotifierSettings);
declare global {
  interface ComponentTypes {
    FormKarmaChangeNotifierSettings: typeof FormKarmaChangeNotifierSettings
  }
}
