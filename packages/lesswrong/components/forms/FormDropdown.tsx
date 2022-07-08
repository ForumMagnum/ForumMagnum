import React from 'react';
import { Components, registerComponent, useStyles } from '../../lib/vulcan-lib/components';
import { useFormComponentContext, formCommonStyles, LWForm } from './formUtil';
import { getCollection } from '../../lib/vulcan-lib/collections';
import { getSchema } from '../../lib/utils/getSchema';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';

const styles = (theme: ThemeType): JssStyles => ({
  ...formCommonStyles(theme),
});

export function FormDropdown<T, FN extends keyof T>({form, fieldName, label, collectionName}: {
  form: LWForm<T>,
  fieldName: NameOfFieldWithType<T,FN,string>,
  label: string,
  collectionName: CollectionNameString,
}) {
  const classes = useStyles(styles, "FormDropdown");
  const {value,setValue} = useFormComponentContext<string,T>(form, fieldName);
  
  // TODO: Move this off the schema
  const collection = getCollection(collectionName);
  const schemaField = getSchema(collection)[fieldName];
  const options: {value:string, label:string}[] = schemaField?.form?.options?.();
  if (!options) throw new Error(`No options provided for dropdown field: ${collectionName}.${fieldName}`);
  
  return <div className={classes.formField}>
    <span className={classes.leftColumn}>
      {label}
    </span>
    <span className={classes.rightColumn}>
      <TextField select value={value}
        onChange={(event) => setValue(event.target.value)}
      >
        {options.map(({value,label: optionLabel}) => <MenuItem key={value} value={value}>
          {optionLabel}
        </MenuItem>)}
      </TextField>
    </span>
  </div>
}

registerComponent('FormDropdown', FormDropdown, {styles});
declare global {
  interface ComponentTypes {
    FormDropdown: typeof FormDropdown
  }
}
