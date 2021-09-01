import React from 'react';
import { registerComponent, useStyles } from '../../lib/vulcan-lib/components';
import { useFormComponentContext, formCommonStyles, LWForm } from './formUtil';

const styles = (theme: ThemeType): JssStyles => ({
  ...formCommonStyles(theme),
});

export function FormUserPermissionGroupMemberships<T, FN extends keyof T>({form, fieldName}: {
  form: LWForm<T>,
  fieldName: NameOfFieldWithType<T,FN,string[]>,
}) {
  const classes = useStyles(styles, "FormUserPermissionGroupMemberships");
  const {value,setValue} = useFormComponentContext<string[],T>(form, fieldName);
  return <div className={classes.formField}>
    { /*TODO*/ }
   </div>
}

registerComponent('FormUserPermissionGroupMemberships', FormUserPermissionGroupMemberships, {styles});
declare global {
  interface ComponentTypes {
    FormUserPermissionGroupMemberships: typeof FormUserPermissionGroupMemberships
  }
}

