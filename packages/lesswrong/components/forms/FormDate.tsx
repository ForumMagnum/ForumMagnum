import React from 'react';
import { registerComponent, useStyles } from '../../lib/vulcan-lib/components';
import { useFormComponentContext, formCommonStyles, LWForm } from './formUtil';

const styles = (theme: ThemeType): JssStyles => ({
  ...formCommonStyles(theme),
});

export function FormDate<T, FN extends keyof T>({form, fieldName, label}: {
  form: LWForm<T>,
  fieldName: NameOfFieldWithType<T,FN,Date>,
  label: string,
}) {
  const classes = useStyles(styles, "FormDate");
  const {value,setValue} = useFormComponentContext<Date,T>(form, fieldName);
  return <div className={classes.formField}>
    {label}
    { /*TODO*/ }
   </div>
}

registerComponent('FormDate', FormDate, {styles});
declare global {
  interface ComponentTypes {
    FormDate: typeof FormDate
  }
}
