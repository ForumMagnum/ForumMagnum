import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import Select from '@/lib/vendor/@material-ui/core/src/Select';
import withErrorBoundary from '../common/withErrorBoundary';
import PropTypes from 'prop-types';
import { defaultNotificationTypeSettings, NotificationChannelOption, NotificationTypeSettings } from '../../lib/collections/users/newSchema';
import { getNotificationTypeByUserSetting } from '../../lib/notificationTypes';
import type { PickedTime } from '../common/BatchTimePicker';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
  root: {
    padding: 8,
  },
  label: {
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
  },
  settings: {
    paddingLeft: 20,
  },
})

interface NotificationSettings extends PickedTime {
  channel: string;
  batchingFrequency: string;
}

const NotificationTypeSettingsWidget = ({ path, value, label, updateCurrentValues, classes }: FormComponentProps<NotificationTypeSettings> & {
  path: keyof DbUser;
  classes: ClassesType<typeof styles>;
}) => {
  const { BatchTimePicker, Typography, MenuItem } = Components;
  const currentValue = { ...defaultNotificationTypeSettings, ...value };
  const notificationType = getNotificationTypeByUserSetting(path);
  
  const modifyValue = (changes: Partial<NotificationSettings>) => {
    void updateCurrentValues({
      [path]: { ...currentValue, ...changes }
    });
  }
  
  const channelOptions: Record<NotificationChannelOption, React.ReactChild> = {
    none: <MenuItem value="none" key="none">Don't notify</MenuItem>,
    onsite: <MenuItem value="onsite" key="onsite">Notify me on-site</MenuItem>,
    email: <MenuItem value="email" key="email">Notify me by email</MenuItem>,
    both: <MenuItem value="both" key="both">Notify me both on-site and by email</MenuItem>
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


const NotificationTypeSettingsWidgetComponent = registerComponent('NotificationTypeSettingsWidget', NotificationTypeSettingsWidget, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    NotificationTypeSettingsWidget: typeof NotificationTypeSettingsWidgetComponent
  }
}
