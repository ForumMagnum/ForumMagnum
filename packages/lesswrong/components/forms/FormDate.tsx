import React from 'react';
import { registerComponent, useStyles } from '../../lib/vulcan-lib/components';
import { useFormComponentContext, formCommonStyles, LWForm } from './formUtil';
import DateTimePicker from 'react-datetime';
import moment from 'moment';

const styles = (theme: ThemeType): JssStyles => ({
  ...formCommonStyles(theme),
  
  datePicker: {
    borderBottom: `solid 1px ${theme.palette.grey[550]}`,
    padding: '6px 0 7px 0'
  },
});

export function FormDate<T, FN extends keyof T>({form, fieldName, label}: {
  form: LWForm<T>,
  fieldName: NameOfFieldWithType<T,FN,Date>,
  label: string,
}) {
  const classes = useStyles(styles, "FormDate");
  const {value,setValue} = useFormComponentContext<Date,T>(form, fieldName);
  return <div className={classes.formField}>
    <span className={classes.leftColumn}>
      {label}
    </span>
    <span className={classes.rightColumn}>
      <DateTimePicker
        className={classes.wrapper}
        value={value}
        inputProps={{
          name: fieldName,
          autoComplete: "off",
          className: classes.datePicker
        }}
        // newDate argument is a Moment object given by react-datetime
        onChange={(newDate: any) => setValue(newDate._d)}
      />
    </span>
   </div>
}

registerComponent('FormDate', FormDate, {styles});
declare global {
  interface ComponentTypes {
    FormDate: typeof FormDate
  }
}
