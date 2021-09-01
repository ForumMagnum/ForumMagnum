import React from 'react';
import { registerComponent, useStyles } from '../../lib/vulcan-lib/components';
import { useFormComponentContext, formCommonStyles, LWForm } from './formUtil';
import Input from '@material-ui/core/Input';

const styles = (theme: ThemeType): JssStyles => ({
  ...formCommonStyles(theme),
  label: {
  },
});

export function FormMultilineText<T, FN extends keyof T>({form, fieldName, label}: {
  form: LWForm<T>,
  fieldName: NameOfFieldWithType<T,FN,string>,
  label: string,
}) {
  const classes = useStyles(styles, "FormMultilineText");
  const {value,setValue} = useFormComponentContext<string,T>(form, fieldName);
  return <div className={classes.formField}>
    <div className={classes.label}>
      {label}
    </div>
    <div>
      <Input
        value={value||""}
        onChange={(ev) => setValue(ev.target.value)}
        multiline={true}
        rows={5}
        fullWidth
      />
    </div>
  </div>
}

registerComponent('FormMultilineText', FormMultilineText, {styles});
declare global {
  interface ComponentTypes {
    FormMultilineText: typeof FormMultilineText
  }
}

