import React from 'react';
import { registerComponent, useStyles } from '../../lib/vulcan-lib/components';
import { useFormComponentContext, formCommonStyles, LWForm } from './formUtil';
import Input from '@material-ui/core/Input';

const styles = (theme: ThemeType): JssStyles => ({
  ...formCommonStyles(theme),
});

export function FormTextbox<T, FN extends keyof T>({form, fieldName, label}: {
  form: LWForm<T>,
  fieldName: NameOfFieldWithType<T,FN,string>,
  label: string,
}) {
  const classes = useStyles(styles, "FormTextbox");
  const {value,setBouncyValue,flushDebounced} = useFormComponentContext<string,T>(form, fieldName);
  
  return <div className={classes.formField}>
    <span className={classes.leftColumn}>
      {label}
    </span>
    <span className={classes.rightColumn}>
      <Input
        value={value||""}
        onChange={(ev) => {
          setBouncyValue(ev.target.value)
        }}
        onBlur={(ev) => {
          flushDebounced();
        }}
      />
    </span>
  </div>
}

registerComponent('FormTextbox', FormTextbox, {styles});
declare global {
  interface ComponentTypes {
    FormTextbox: typeof FormTextbox
  }
}
