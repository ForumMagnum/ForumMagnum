import React from 'react';
import { registerComponent, Components, useStyles } from '../../lib/vulcan-lib/components';
import { useFormComponentContext, formCommonStyles, LWForm } from './formUtil';
import { NotificationTypeSettings, defaultNotificationTypeSettings } from '../../lib/collections/users/custom_fields';
import { getNotificationTypeByUserSetting } from '../../lib/notificationTypes';
import withErrorBoundary from '../common/withErrorBoundary';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

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
  const { BatchTimePicker } = Components;
  
  const currentValue = { ...defaultNotificationTypeSettings, ...value };
  const notificationType = getNotificationTypeByUserSetting(fieldName as keyof DbUser);
  
  const modifyValue = (changes) => {
    setValue({ ...currentValue, ...changes });
  }
  
  return <div className={classes.formField}>
    <span className={classes.leftColumn}>
      {label}
    </span>
    <span className={classes.rightColumn}>
      <Select
        value={currentValue.channel}
        onChange={(event) =>
          modifyValue({ channel: event.target.value })}
      >
        {!notificationType.mustBeEnabled && <MenuItem value="none">Don't notify</MenuItem>}
        <MenuItem value="onsite">Notify me on-site</MenuItem>
        <MenuItem value="email">Notify me by email</MenuItem>
        <MenuItem value="both">Notify me both on-site and by email</MenuItem>
      </Select>
      { currentValue.channel !== "none" && <React.Fragment>
        {" "}
        <Select
          value={currentValue.batchingFrequency}
          onChange={(event) =>
            modifyValue({ batchingFrequency: event.target.value })}
        >
          <MenuItem value="realtime">immediately</MenuItem>
          <MenuItem value="daily">daily</MenuItem>
          <MenuItem value="weekly">weekly</MenuItem>
        </Select>
      </React.Fragment>}
      { (currentValue.channel !== "none" && (currentValue.batchingFrequency==="daily" || currentValue.batchingFrequency==="weekly")) && <React.Fragment>
        {" at "}
        <BatchTimePicker
          mode={currentValue.batchingFrequency}
          value={{timeOfDayGMT: currentValue.timeOfDayGMT, dayOfWeekGMT: currentValue.dayOfWeekGMT}}
          onChange={newBatchTime => modifyValue(newBatchTime)}
        />
      </React.Fragment>}
    </span>
  </div>
}

registerComponent('FormNotificationTypeSettings', FormNotificationTypeSettings, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    FormNotificationTypeSettings: typeof FormNotificationTypeSettings
  }
}
