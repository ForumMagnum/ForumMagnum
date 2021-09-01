import React from 'react';
import { registerComponent, useStyles } from '../../lib/vulcan-lib/components';
import { useFormComponentContext, formCommonStyles, LWForm } from './formUtil';
import type { NotificationTypeSettings } from '../../lib/collections/users/custom_fields';

const styles = (theme: ThemeType): JssStyles => ({
  ...formCommonStyles(theme),
});

export function FormNotificationTypeSettings<T, FN extends keyof T>({form, fieldName, label}: {
  form: LWForm<T>,
  fieldName: NameOfFieldWithType<T,FN,NotificationTypeSettings>,
  label: string,
}) {
  const classes = useStyles(styles, "FormNotificationTypeSettings");
  const {value,setValue} = useFormComponentContext<NotificationTypeSettings,T>(form, fieldName);
  return <div className={classes.formField}>
    {label}
    { /*TODO*/ }
  </div>
}

registerComponent('FormNotificationTypeSettings', FormNotificationTypeSettings, {styles});
declare global {
  interface ComponentTypes {
    FormNotificationTypeSettings: typeof FormNotificationTypeSettings
  }
}
