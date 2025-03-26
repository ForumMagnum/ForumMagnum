import React, { useCallback } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import Select from '@/lib/vendor/@material-ui/core/src/Select';
import withErrorBoundary from '../common/withErrorBoundary';
import PropTypes from 'prop-types';
import {
  DayOfWeek,
  NotificationTypeSettings,
  LegacyNotificationTypeSettings,
  legacyToNewNotificationTypeSettings,
  NotificationBatchingFrequency,
  NotificationChannel,
  NotificationChannelSettings
} from '../../lib/collections/users/newSchema';
import { getNotificationTypeByUserSetting } from '../../lib/notificationTypes';
import type { PickedTime } from '../common/BatchTimePicker';
import { isFriendlyUI } from '../../themes/forumTheme';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  root: {
    paddingLeft: 8,
    paddingRight: 8,
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  label: {
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
  },
  channelLabel: {
    fontSize: 13
  },
  channelSettings: {
    paddingLeft: 8,
    display: "flex",
    gap: "8px",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 13,
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 0,
    }
  },
  channelSettingsDetails: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "4px",
    ...theme.typography.body2,
    fontSize: 13,
    "&>*": {
      whiteSpace: "nowrap"
    }
  },
  channelSettingsDisabled: {
    color: theme.palette.grey[600]
  },
  toggle: {
    alignItems: "center",
    marginRight: 8,
    [theme.breakpoints.down('sm')]: {
      marginRight: 0,
    }
  }
})

type NotificationTypeSettingsWidgetProps = {
  path: keyof DbUser;
  value: NotificationTypeSettings | LegacyNotificationTypeSettings;
  updateCurrentValues: Function,
  label: string;
  classes: ClassesType<typeof styles>;
};

const getChannelLabel = (channel: NotificationChannel): string => {
  switch (channel) {
    case "onsite":
      return "on-site";
    case "email":
      return "by email";
    default:
      return "";
  }
}

const NotificationTypeSettingsWidget = ({
  path,
  value,
  updateCurrentValues,
  label,
  classes
}: NotificationTypeSettingsWidgetProps) => {
  const { BatchTimePicker, Typography, MenuItem, ToggleSwitch } = Components;
  const notificationType = getNotificationTypeByUserSetting(path);

  const cleanValue = legacyToNewNotificationTypeSettings(value);

  const modifyChannelValue = useCallback((channel: NotificationChannel, changes: Partial<NotificationChannelSettings>) => {
    const newSettings = {
      ...cleanValue,
      [channel]: { ...cleanValue[channel], ...changes }
    };
    updateCurrentValues({ [path]: newSettings });
  }, [cleanValue, updateCurrentValues, path]);

  return (
    <div className={classes.root}>
      <Typography variant="body1" className={classes.label}>
        {label}
      </Typography>
      {notificationType.allowedChannels?.map((channel: NotificationChannel) => {
        const channelSettings: NotificationChannelSettings = cleanValue[channel];

        return (
          <div key={channel} className={classes.channelSettings}>
            <div className={classNames(classes.channelSettingsDetails, { [classes.channelSettingsDisabled]: !channelSettings.enabled })}>
              Notify me {getChannelLabel(channel)}
              <Select
                value={channelSettings.batchingFrequency}
                onChange={(event) =>
                  modifyChannelValue(channel, {
                    batchingFrequency: event.target.value as NotificationBatchingFrequency,
                  })
                }
                disabled={!channelSettings.enabled}
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
                    disabled={!channelSettings.enabled}
                  />
                </>
              )}
            </div>
            <ToggleSwitch
              value={channelSettings.enabled}
              setValue={(val) => modifyChannelValue(channel, { enabled: val })}
              className={classes.toggle}
              smallVersion
            />
          </div>
        );
      })}
    </div>
  );
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
