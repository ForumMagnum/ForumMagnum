import React, { useCallback } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import {
  DayOfWeek,
  NotificationTypeSettings,
  NotificationBatchingFrequency,
  NotificationChannel,
  NotificationChannelSettings,
  LegacyNotificationTypeSettings,
  legacyToNewNotificationTypeSettings,
} from '@/lib/collections/users/notificationFieldHelpers';
import { getNotificationTypeByUserSetting } from '@/lib/notificationTypes';
import BatchTimePicker, { PickedTime } from '@/components/common/BatchTimePicker';
import type { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';
import type { EditableUser } from '@/lib/collections/users/helpers';

const styles = defineStyles('NotificationSettingsRow', (theme: ThemeType) => ({
  root: {
    padding: '9px 0',
    borderBottom: `1px solid ${theme.palette.greyAlpha(0.06)}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  mainRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
      gap: 8,
    },
  },
  label: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: 500,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[800],
    lineHeight: 1.4,
    paddingTop: 2,
  },
  channels: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
    flexShrink: 0,
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      gap: 12,
    },
  },
  channelControl: {
    display: 'flex',
    flexDirection: 'column',
    width: 148,
    gap: 4,
    [theme.breakpoints.down('xs')]: {
      flex: 1,
      width: 'auto',
    },
  },
  channelControlMain: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    [theme.breakpoints.down('xs')]: {
      justifyContent: 'flex-start',
    },
  },
  frequencySelect: {
    appearance: 'none',
    border: `1px solid ${theme.palette.greyAlpha(0.12)}`,
    borderRadius: 4,
    padding: '3px 24px 3px 8px',
    fontSize: 12,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[700],
    background: `${theme.palette.panelBackground.default} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%23999'/%3E%3C/svg%3E") no-repeat right 8px center`,
    cursor: 'pointer',
    transition: 'border-color 0.15s ease',
    '&:hover': {
      borderColor: theme.palette.greyAlpha(0.25),
    },
    '&:focus': {
      outline: 'none',
      borderColor: theme.palette.primary.main,
    },
    '&:disabled': {
      opacity: 0.35,
      cursor: 'not-allowed',
    },
  },
  toggle: {
    position: 'relative',
    width: 32,
    minWidth: 32,
    height: 18,
    borderRadius: 9,
    cursor: 'pointer',
    transition: 'background 0.2s ease',
    flexShrink: 0,
  },
  toggleOff: {
    background: theme.palette.grey[300],
  },
  toggleOn: {
    background: theme.palette.primary.main,
  },
  toggleHandle: {
    position: 'absolute',
    top: 2,
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: theme.palette.text.alwaysWhite,
    transition: 'left 0.2s ease',
    boxShadow: theme.palette.boxShadow.moreFocused,
  },
  toggleHandleOff: {
    left: 2,
  },
  toggleHandleOn: {
    left: 16,
  },
  timePicker: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    whiteSpace: 'nowrap' as const,
    fontSize: 12,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[500],
    // Style the MUI Selects rendered by BatchTimePicker
    '& .MuiInput-underline:before, & .MuiInput-underline:after': {
      display: 'none',
    },
    '& .MuiSelect-root': {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily,
      padding: '2px 20px 2px 4px',
      border: `1px solid ${theme.palette.greyAlpha(0.12)}`,
      borderRadius: 4,
    },
    '& .MuiSelect-icon': {
      right: 2,
      fontSize: 16,
      color: theme.palette.grey[400],
    },
  },
  // Column headers
  columnHeaders: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: `1px solid ${theme.palette.greyAlpha(0.06)}`,
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  columnHeaderSpacer: {
    flex: 1,
  },
  channelHeaders: {
    display: 'flex',
    gap: 16,
    flexShrink: 0,
  },
  columnHeader: {
    width: 148,
    fontSize: 11,
    fontWeight: 600,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[400],
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    textAlign: 'center' as const,
  },
  // Mobile channel labels (shown only on mobile when column headers are hidden)
  mobileChannelLabel: {
    display: 'none',
    [theme.breakpoints.down('xs')]: {
      display: 'block',
      fontSize: 11,
      fontWeight: 600,
      fontFamily: theme.typography.fontFamily,
      color: theme.palette.grey[400],
      textTransform: 'uppercase' as const,
      letterSpacing: '0.04em',
      marginBottom: 4,
    },
  },
}));

interface NotificationSettingsRowProps {
  field: TypedFieldApi<NotificationTypeSettings | LegacyNotificationTypeSettings, EditableUser>;
  label: string;
}

const NotificationSettingsRow = ({ field, label }: NotificationSettingsRowProps) => {
  const classes = useStyles(styles);
  const path = field.name;
  const value = field.state.value;

  const notificationType = getNotificationTypeByUserSetting(path as keyof EditableUser & `notification${string}`);
  const cleanValue = legacyToNewNotificationTypeSettings(value);
  const allowedChannels = notificationType.allowedChannels ?? ['onsite', 'email'];

  const modifyChannelValue = useCallback((channel: NotificationChannel, changes: Partial<NotificationChannelSettings>) => {
    const newSettings = {
      ...cleanValue,
      [channel]: { ...cleanValue[channel], ...changes },
    };
    field.handleChange(newSettings);
  }, [cleanValue, field]);

  return (
    <div className={classes.root}>
      <div className={classes.mainRow}>
        <div className={classes.label}>{label}</div>
        <div className={classes.channels}>
          {(['onsite', 'email'] as const).map((channel) => {
            const isAllowed = allowedChannels.includes(channel);
            if (!isAllowed) {
              return <div key={channel} className={classes.channelControl} />;
            }
            const channelSettings = cleanValue[channel];
            const needsTimePicker = channelSettings.enabled &&
              (channelSettings.batchingFrequency === 'daily' || channelSettings.batchingFrequency === 'weekly');

            return (
              <div key={channel} className={classes.channelControl}>
                <div className={classes.mobileChannelLabel}>
                  {channel === 'onsite' ? 'On-site' : 'Email'}
                </div>
                <div className={classes.channelControlMain}>
                  <select
                    className={classes.frequencySelect}
                    value={channelSettings.batchingFrequency}
                    onChange={(e) => modifyChannelValue(channel, {
                      batchingFrequency: e.target.value as NotificationBatchingFrequency,
                    })}
                    disabled={!channelSettings.enabled}
                  >
                    <option value="realtime">immediately</option>
                    <option value="daily">daily</option>
                    <option value="weekly">weekly</option>
                  </select>
                  <div
                    className={classNames(classes.toggle, channelSettings.enabled ? classes.toggleOn : classes.toggleOff)}
                    onClick={() => modifyChannelValue(channel, { enabled: !channelSettings.enabled })}
                  >
                    <div className={classNames(classes.toggleHandle, channelSettings.enabled ? classes.toggleHandleOn : classes.toggleHandleOff)} />
                  </div>
                </div>
                {needsTimePicker && (
                  <div className={classes.timePicker}>
                    at{' '}
                    <BatchTimePicker
                      mode={channelSettings.batchingFrequency}
                      value={{
                        timeOfDayGMT: channelSettings.timeOfDayGMT ?? 12,
                        dayOfWeekGMT: channelSettings.dayOfWeekGMT ?? 'Monday',
                      }}
                      onChange={(newPickedTime: PickedTime) =>
                        modifyChannelValue(channel, {
                          timeOfDayGMT: newPickedTime.timeOfDayGMT,
                          dayOfWeekGMT: newPickedTime.dayOfWeekGMT as DayOfWeek,
                        })
                      }
                      disabled={!channelSettings.enabled}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const NotificationColumnHeaders = () => {
  const classes = useStyles(styles);
  return (
    <div className={classes.columnHeaders}>
      <div className={classes.columnHeaderSpacer} />
      <div className={classes.channelHeaders}>
        <div className={classes.columnHeader}>Notify on-site</div>
        <div className={classes.columnHeader}>Notify by email</div>
      </div>
    </div>
  );
};

export default NotificationSettingsRow;
