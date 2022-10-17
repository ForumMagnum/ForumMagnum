import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import withErrorBoundary from '../common/withErrorBoundary';
import PropTypes from 'prop-types';
import { defaultNotificationTypeSettings, NotificationChannelOption } from '../../lib/collections/users/schema';
import { getNotificationTypeByUserSetting } from '../../lib/notificationTypes';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: 8,
  },
  label: {},
  settings: {
    paddingLeft: 20,
  },
})

const NotificationTypeSettings = ({ path, value, label, classes }, context) => {
  const { BatchTimePicker, Typography } = Components;
  const currentValue = { ...defaultNotificationTypeSettings, ...value };
  const notificationType = getNotificationTypeByUserSetting(path);
  
  const modifyValue = (changes) => {
    context.updateCurrentValues({
      [path]: { ...currentValue, ...changes }
    });
  }
  
  const channelOptions: Record<NotificationChannelOption, React.ReactChild> = {
    none: <MenuItem value="none">Don't notify</MenuItem>,
    onsite: <MenuItem value="onsite">Notify me on-site</MenuItem>,
    email: <MenuItem value="email">Notify me by email</MenuItem>,
    both: <MenuItem value="both">Notify me both on-site and by email</MenuItem>
  }
  
  return <div className={classes.root}>
    <Typography variant="body1" className={classes.label}>{label}</Typography>
    <Typography variant="body2" component="div" className={classes.settings}>
      <Select
        value={currentValue.channel}
        onChange={(event) =>
          modifyValue({ channel: event.target.value })}
      >
        {notificationType.allowedChannels?.length ?
          notificationType.allowedChannels.map(channel => channelOptions[channel]) : <></>}
        {/* {!notificationType.mustBeEnabled && <MenuItem value="none">Don't notify</MenuItem>}
        <MenuItem value="onsite">Notify me on-site</MenuItem>
        <MenuItem value="email">Notify me by email</MenuItem>
        <MenuItem value="both">Notify me both on-site and by email</MenuItem> */}
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
    </Typography>
  </div>
}


NotificationTypeSettings.contextTypes = {
  updateCurrentValues: PropTypes.func,
};

const NotificationTypeSettingsComponent = registerComponent('NotificationTypeSettings', NotificationTypeSettings, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    NotificationTypeSettings: typeof NotificationTypeSettingsComponent
  }
}
