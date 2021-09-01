import React from 'react';
import { registerComponent, useStyles } from '../../lib/vulcan-lib/components';
import { useFormComponentContext, formCommonStyles, LWForm } from './formUtil';
import type { KarmaChangeSettingsType } from '../../lib/collections/users/custom_fields';

const styles = (theme: ThemeType): JssStyles => ({
  ...formCommonStyles(theme),
});

export function FormKarmaChangeNotifierSettings<T, FN extends keyof T>({form, fieldName}: {
  form: LWForm<T>,
  fieldName: NameOfFieldWithType<T,FN,KarmaChangeSettingsType>,
}) {
  const classes = useStyles(styles, "FormKarmaChangeNotifierSettings");
  const {value,setValue} = useFormComponentContext<KarmaChangeSettingsType,T>(form, fieldName);
  return <div className={classes.formField}>
    Karma change notifier settings
    { /*TODO*/ }
  </div>
}

registerComponent('FormKarmaChangeNotifierSettings', FormKarmaChangeNotifierSettings, {styles});
declare global {
  interface ComponentTypes {
    FormKarmaChangeNotifierSettings: typeof FormKarmaChangeNotifierSettings
  }
}
