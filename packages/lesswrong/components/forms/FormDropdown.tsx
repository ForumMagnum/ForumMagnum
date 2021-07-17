import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useFormComponentContext, LWForm } from './formUtil';
import { getCollection } from '../../lib/vulcan-lib/collections';
import { getSchema } from '../../lib/utils/getSchema';
import MenuItem from '@material-ui/core/MenuItem';

export function FormDropdown<T, FN extends keyof T>({form, fieldName, label, collectionName}: {
  form: LWForm<T>,
  fieldName: NameOfFieldWithType<T,FN,string>,
  label: string,
  collectionName: CollectionNameString,
}) {
  const {value,setValue} = useFormComponentContext<string,T>(form, fieldName);
  
  // TODO: Move this off the schema
  const collection = getCollection(collectionName);
  const schemaField = getSchema(collection)[fieldName];
  const options: {value:string, label:string}[] = schemaField?.form?.options?.();
  if (!options) throw new Error(`No options provided for dropdown field: ${collectionName}.${fieldName}`);
  
  return <Components.MuiTextField select
    value={value}
    defaultValue={value}
    onChange={setValue}
    label={label}
  >
    {options.map(({value,label: optionLabel}) => <MenuItem key={value} value={value}>
      {optionLabel}
    </MenuItem>)}
  </Components.MuiTextField>
}

registerComponent('FormDropdown', FormDropdown);
declare global {
  interface ComponentTypes {
    FormDropdown: typeof FormDropdown
  }
}
