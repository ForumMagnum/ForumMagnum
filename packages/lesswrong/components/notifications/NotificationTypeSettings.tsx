import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Select from '@material-ui/core/Select';
import withErrorBoundary from '../common/withErrorBoundary';
import {
  DayOfWeek,
  defaultNotificationTypeSettings,
  NotificationBatchingFrequency,
  NotificationChannel,
  NotificationChannelSettings,
  NotificationTypeSettings,
} from "../../lib/collections/users/schema";
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

type OldNotificationType = {
  channel: "none" | "onsite" | "email" | "both",
  batchingFrequency: "realtime" | "daily" | "weekly",
  timeOfDayGMT: 12,
  dayOfWeekGMT: "Monday",
}

// TODO styling
const convertFormat = (oldFormat: OldNotificationType | null): NotificationTypeSettings => {
  if (!oldFormat) return defaultNotificationTypeSettings;

  const { channel, batchingFrequency, timeOfDayGMT, dayOfWeekGMT } = oldFormat;

  return {
    onsite: {
      batchingFrequency: (channel === "both" || channel === "onsite") ? batchingFrequency : "disabled",
      timeOfDayGMT,
      dayOfWeekGMT,
    },
    email: {
      batchingFrequency: (channel === "both" || channel === "email") ? batchingFrequency : "disabled",
      timeOfDayGMT,
      dayOfWeekGMT,
    },
  };
};

function NotificationTypeSettings({
  path,
  value,
  updateCurrentValues,
  label,
  classes
}: {
  path: keyof DbUser;
  value: NotificationTypeSettings;
  updateCurrentValues: Function,
  label: string;
  classes: ClassesType<typeof styles>;
}, context: any) {
  const { BatchTimePicker, Typography, MenuItem } = Components;
  const notificationType = getNotificationTypeByUserSetting(path);

  if ((value as unknown as OldNotificationType)?.dayOfWeekGMT || !value) {
    value = convertFormat(value as unknown as OldNotificationType)
    updateCurrentValues({ [path]: value });
  }

  /*
   * Merges channel updates back into the overall settings object.
   * channel: The notification channel (e.g. "onsite" or "email")
   * changes: The partial updated fields for that channel (batchingFrequency, dayOfWeekGMT, etc.)
   */
  const modifyChannelValue = (channel: NotificationChannel, changes: Partial<NotificationChannelSettings>) => {
    const newSettings = {
      ...value,
      [channel]: { ...value[channel], ...changes }
    };
    updateCurrentValues({ [path]: newSettings });
  };

  return (
    <div className={classes.root}>
      <Typography variant="body1" className={classes.label}>{label}</Typography>
      {/* Display each channel in its own section */}
      {notificationType.allowedChannels?.map((channel: NotificationChannel) => {
        // Fall back if the channel config isn't present in value yet
        const channelSettings = value[channel] || {
          batchingFrequency: 'disabled',
          timeOfDayGMT: 0,
          dayOfWeekGMT: 'Monday' // or whichever default you prefer
        };

        return (
          <div key={channel} className={classes.settings}>
            <Typography variant="body2" component="div">
              <strong>{channel.toUpperCase()}</strong>
            </Typography>

            {/* Batching Frequency Selector */}
            <Select
              value={channelSettings.batchingFrequency}
              onChange={(event) =>
                modifyChannelValue(channel, { batchingFrequency: event.target.value as NotificationBatchingFrequency })
              }
            >
              <MenuItem value="realtime">immediately</MenuItem>
              <MenuItem value="daily">daily</MenuItem>
              <MenuItem value="weekly">weekly</MenuItem>
              <MenuItem value="disabled">never</MenuItem>
            </Select>

            {/* Only show time/day pickers for daily/weekly */}
            {(channelSettings.batchingFrequency === 'daily' ||
              channelSettings.batchingFrequency === 'weekly') && (
              <>
                {" at "}
                <BatchTimePicker
                  mode={channelSettings.batchingFrequency ?? 'realtime'}
                  value={{
                    timeOfDayGMT: channelSettings.timeOfDayGMT ?? 12,
                    dayOfWeekGMT: channelSettings.dayOfWeekGMT ?? "Monday"
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
        );
      })}
    </div>
  );
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
