import React, { useCallback } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Select from '@material-ui/core/Select';
import withErrorBoundary from '../common/withErrorBoundary';
import {
  DayOfWeek,
  isLegacyNotificationTypeSettings,
  legacyDefaultNotificationTypeSettings,
  LegacyNotificationTypeSettings,
  legacyToNewNotificationTypeSettings,
  newToLegacyNotificationTypeSettings,
  NotificationBatchingFrequency,
  NotificationChannel,
  NotificationChannelSettings,
  NotificationTypeSettings,
} from "../../lib/collections/users/schema";
import { getNotificationTypeByUserSetting } from '../../lib/notificationTypes';
import type { PickedTime } from '../common/BatchTimePicker';
import { isBookUI, isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
  root: {
    padding: 8,
  },
  label: {
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
  },
  channelSettings: {
    paddingLeft: 20,
    display: "flex",
    justifyContent: "space-between"
  },
  channelEnabledSettings: {
    display: "flex",
  }
})

interface NotificationSettings extends PickedTime {
  channel: string;
  batchingFrequency: string;
}

type NotificationTypeSettingsProps = {
  path: keyof DbUser;
  value: NotificationTypeSettings | LegacyNotificationTypeSettings;
  updateCurrentValues: Function,
  label: string;
  classes: ClassesType<typeof styles>;
};

const BookNotificationTypeSettings = ({ path, value, label, updateCurrentValues, classes }: NotificationTypeSettingsProps) => {
  const { BatchTimePicker, Typography, MenuItem } = Components;
  const currentValue = { ...legacyDefaultNotificationTypeSettings, ...value };
  const cleanValue = newToLegacyNotificationTypeSettings(currentValue);

  const notificationType = getNotificationTypeByUserSetting(path);
  
  const modifyValue = (changes: Partial<NotificationSettings>) => {
    void updateCurrentValues({
      [path]: legacyToNewNotificationTypeSettings({ ...cleanValue, ...changes } as LegacyNotificationTypeSettings)
    });
  }
  
  const channelOptions: Record<"none" | "onsite" | "email" | "both", React.ReactNode> = {
    none: <MenuItem value="none" key="none">Don't notify</MenuItem>,
    onsite: <MenuItem value="onsite" key="onsite">Notify me on-site</MenuItem>,
    email: <MenuItem value="email" key="email">Notify me by email</MenuItem>,
    both: <MenuItem value="both" key="both">Notify me both on-site and by email</MenuItem>
  }
  
  return <div className={classes.root}>
    <Typography variant="body1" className={classes.label}>{label}</Typography>
    <Typography variant="body2" component="div" className={classes.channelSettings}>
      <Select
        value={cleanValue.channel}
        onChange={(event) =>
          modifyValue({ channel: event.target.value })}
      >
        {/* TODO this isn't quite working because of the change to allowedChannels */}
        {notificationType.allowedChannels?.length ?
          notificationType.allowedChannels.map(channel => channelOptions[channel]) : <></>}
      </Select>
      { cleanValue.channel !== "none" && <React.Fragment>
        {" "}
        <Select
          value={cleanValue.batchingFrequency}
          onChange={(event) =>
            modifyValue({ batchingFrequency: event.target.value })}
        >
          <MenuItem value="realtime">immediately</MenuItem>
          <MenuItem value="daily">daily</MenuItem>
          <MenuItem value="weekly">weekly</MenuItem>
        </Select>
      </React.Fragment>}
      { (cleanValue.channel !== "none" && (cleanValue.batchingFrequency==="daily" || cleanValue.batchingFrequency==="weekly")) && <React.Fragment>
        {" at "}
        <BatchTimePicker
          mode={cleanValue.batchingFrequency}
          value={{timeOfDayGMT: cleanValue.timeOfDayGMT, dayOfWeekGMT: cleanValue.dayOfWeekGMT}}
          onChange={newBatchTime => modifyValue(newBatchTime)}
        />
      </React.Fragment>}
    </Typography>
  </div>
}

const FriendlyNotificationTypeSettings = ({
  path,
  value,
  updateCurrentValues,
  label,
  classes
}: NotificationTypeSettingsProps) => {
  const { BatchTimePicker, Typography, MenuItem, ToggleSwitch } = Components;
  const notificationType = getNotificationTypeByUserSetting(path);

  const cleanValue = legacyToNewNotificationTypeSettings(value);
  if (isLegacyNotificationTypeSettings(value) || !value) {
    updateCurrentValues({ [path]: cleanValue });
  }

  const modifyChannelValue = useCallback((channel: NotificationChannel, changes: Partial<NotificationChannelSettings>) => {
    const newSettings = {
      ...value,
      [channel]: { ...cleanValue[channel], ...changes }
    };
    updateCurrentValues({ [path]: newSettings });
  }, [value, cleanValue, updateCurrentValues, path]);

  return (
    <div className={classes.root}>
      <div>
        <Typography variant="body1" className={classes.label}>
          {label}
        </Typography>
      </div>
      {notificationType.allowedChannels?.map((channel: NotificationChannel) => {
        const channelSettings = cleanValue[channel] || {
          batchingFrequency: "disabled",
          timeOfDayGMT: 0,
          dayOfWeekGMT: "Monday",
        };

        const toggleEnabled = (val: boolean) => modifyChannelValue(channel, { batchingFrequency: val ? "daily" : "disabled" })

        return (
          <div key={channel} className={classes.channelSettings}>
            <div className={classes.channelEnabledSettings}>
              <Typography variant="body2" component="div">
                Notify me on-site
              </Typography>
              <Select
                value={channelSettings.batchingFrequency}
                onChange={(event) =>
                  modifyChannelValue(channel, { batchingFrequency: event.target.value as NotificationBatchingFrequency })
                }
              >
                <MenuItem value="realtime">immediately</MenuItem>
                <MenuItem value="daily">daily</MenuItem>
                <MenuItem value="weekly">weekly</MenuItem>
              </Select>
              {(channelSettings.batchingFrequency === "daily" || channelSettings.batchingFrequency === "weekly") && (
                <>
                  {" at "}
                  <BatchTimePicker
                    mode={channelSettings.batchingFrequency ?? "realtime"}
                    value={{
                      timeOfDayGMT: channelSettings.timeOfDayGMT ?? 12,
                      dayOfWeekGMT: channelSettings.dayOfWeekGMT ?? "Monday",
                    }}
                    onChange={(newPickedTime: PickedTime) =>
                      modifyChannelValue(channel, {
                        timeOfDayGMT: newPickedTime.timeOfDayGMT,
                        dayOfWeekGMT: newPickedTime.dayOfWeekGMT as DayOfWeek,
                      })
                    }
                  />
                </>
              )}
            </div>
            <ToggleSwitch value={channelSettings.batchingFrequency !== "disabled"} setValue={toggleEnabled} smallVersion />
          </div>
        );
      })}
    </div>
  );
}

function NotificationTypeSettings({
  path,
  value,
  updateCurrentValues,
  label,
  classes
}: NotificationTypeSettingsProps) {
  if (isBookUI) {
    return <BookNotificationTypeSettings
      path={path}
      value={newToLegacyNotificationTypeSettings(value)}
      updateCurrentValues={updateCurrentValues}
      label={label}
      classes={classes}
    />
  }

  return <FriendlyNotificationTypeSettings
    path={path}
    value={value}
    updateCurrentValues={updateCurrentValues}
    label={label}
    classes={classes}
  />
}

const NotificationTypeSettingsComponent = registerComponent('NotificationTypeSettings', NotificationTypeSettings, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    NotificationTypeSettings: typeof NotificationTypeSettingsComponent
  }
}
