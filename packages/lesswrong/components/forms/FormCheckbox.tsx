import React from 'react';
import { registerComponent, useStyles } from '../../lib/vulcan-lib/components';
import { useFormComponentContext, formCommonStyles, LWForm } from './formUtil';
import Checkbox from '@material-ui/core/Checkbox';

const styles = (theme: ThemeType): JssStyles => ({
  ...formCommonStyles(theme),
  label: {
  },
  checkbox: {
    paddingRight: 8,
    paddingLeft: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
});

export function FormCheckbox<T, FN extends keyof T>({form, fieldName, label}: {
  form: LWForm<T>,
  fieldName: NameOfFieldWithType<T,FN,boolean>,
  label: string,
}) {
  const classes = useStyles(styles, "FormCheckbox");
  const {value,setValue} = useFormComponentContext<boolean,T>(form, fieldName);
  return <div className={classes.formField}>
    <Checkbox className={classes.checkbox} checked={value} onChange={(event) => {
      setValue(event.target.checked);
    }}/>
    <span className={classes.label}>
      {label}
    </span>
   </div>
}

registerComponent('FormCheckbox', FormCheckbox, {styles});
declare global {
  interface ComponentTypes {
    FormCheckbox: typeof FormCheckbox
  }
}
