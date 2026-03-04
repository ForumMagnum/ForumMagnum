import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import Radio from '@/lib/vendor/@material-ui/core/src/Radio';
import FormControlLabel from '@/lib/vendor/@material-ui/core/src/FormControlLabel';
import Select from '@/lib/vendor/@material-ui/core/src/Select';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import { useTimezone } from '../common/withTimezone';
import withErrorBoundary from '../common/withErrorBoundary';
import moment from '../../lib/moment-timezone';
import { convertTimeOfWeekTimezone } from '../../lib/utils/timeUtil';
import { karmaChangeNotifierDefaultSettings, KarmaChangeUpdateFrequency, type KarmaChangeSettingsType } from '../../lib/collections/users/helpers';
import { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';
import { defineStyles, useStyles } from '../hooks/useStyles';

import { MenuItem } from "../common/Menus";

const styles = defineStyles('KarmaChangeNotifierSettings', (theme: ThemeType) => ({
  root: {
    fontFamily: theme.typography.fontFamily,
  },
  heading: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.grey[800],
  },
  description: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.grey[600],
    lineHeight: 1.5,
    marginTop: 4,
  },
  radioGroup: {
    display: "flex",
    flexDirection: 'column',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 2,
  },
  radioButton: {
    padding: 4,
  },
  radioLabel: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.grey[700],
  },
  inline: {
    display: "inline",
  },
  checkbox: {
    paddingRight: 4,
  },
  showNegative: {
    marginTop: 4,
  },
  warningText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    color: theme.palette.grey[500],
    fontStyle: 'italic',
    marginTop: 4,
  },
}));

type KarmaNotificationTimingStrings = {
  label: string
  infoText: string
  emptyText: string
};


export function getKarmaNotificationTimingChoices(): Record<string, KarmaNotificationTimingStrings> {
  const choices = {
    disabled: {
      label: "Disabled",
      infoText: "Karma and react notifications are disabled",
      emptyText: "Karma and react notifications are disabled"
    },
    daily: {
      label: "Batched daily",
      infoText: "Karma Changes and Reacts (batched daily):",
      emptyText: "No karma changes or reacts yesterday"
    },
    weekly: {
      label: "Batched weekly",
      infoText: "Karma Changes and Reacts (batched weekly):",
      emptyText: "No karma changes or reacts last week"
    },
    realtime: {
      label: "Realtime",
      infoText: "Recent Karma Changes and Reacts",
      emptyText: "No karma changes or reacts since you last checked"
    },
  };

  const defaultValue = (karmaChangeNotifierDefaultSettings.get()).updateFrequency;
  choices[defaultValue].label += " (default)"

  return choices;
}

const getBatchingTimeLocalTZ = (settings: KarmaChangeSettingsType, timezone: any) => {
  const { timeOfDayGMT, dayOfWeekGMT } = settings;
  const { timeOfDay, dayOfWeek } = convertTimeOfWeekTimezone(timeOfDayGMT, dayOfWeekGMT, "GMT", timezone);
  return { timeOfDay, dayOfWeek };
};

const KarmaChangeNotifierSettings = ({
  field,
}: {
  field: TypedFieldApi<KarmaChangeSettingsType>;
}) => {
  const classes = useStyles(styles);
  const { timezone } = useTimezone();
  const settings = field.state.value;

  const modifyValue = (changes: Partial<KarmaChangeSettingsType>) => {
    const newSettings = { ...settings, ...changes };
    field.handleChange(newSettings);
  };
  
  const setBatchingTimeOfDay = (timeOfDay: number, tz: AnyBecauseTodo) => {
    const oldTimeLocalTZ = getBatchingTimeLocalTZ(settings, timezone);
    const newTimeLocalTZ = {
      timeOfDay: timeOfDay,
      dayOfWeek: oldTimeLocalTZ.dayOfWeek
    };
    const newTimeGMT = convertTimeOfWeekTimezone(newTimeLocalTZ.timeOfDay, newTimeLocalTZ.dayOfWeek, tz, "GMT");
    
    modifyValue({
      timeOfDayGMT: newTimeGMT.timeOfDay,
      dayOfWeekGMT: newTimeGMT.dayOfWeek,
    });
  };
  
  const setBatchingDayOfWeek = (dayOfWeek: string, tz: AnyBecauseTodo) => {
    const oldTimeLocalTZ = getBatchingTimeLocalTZ(settings, timezone);
    const newTimeLocalTZ = {
      timeOfDay: oldTimeLocalTZ.timeOfDay,
      dayOfWeek: dayOfWeek
    };
    const newTimeGMT = convertTimeOfWeekTimezone(newTimeLocalTZ.timeOfDay, newTimeLocalTZ.dayOfWeek, tz, "GMT");
    
    modifyValue({
      timeOfDayGMT: newTimeGMT.timeOfDay,
      dayOfWeekGMT: newTimeGMT.dayOfWeek,
    });
  };
  
  if (!settings.timeOfDayGMT || !settings.dayOfWeekGMT) {
    return null
  }
  
  const {timeOfDay, dayOfWeek} = getBatchingTimeLocalTZ(settings, timezone);
  
  const batchTimingChoices = <span>
    { (settings.updateFrequency==="daily" || settings.updateFrequency==="weekly") &&
      <React.Fragment>
        {" at "}<Select
          value={timeOfDay}
          onChange={(event) => setBatchingTimeOfDay(parseInt(event.target.value), timezone)}
        >
          { Array.from({ length: 24 }, (_, hour) =>
              <MenuItem key={hour} value={hour}>{hour}:00</MenuItem>
            )
          }
        </Select>
        
        {moment().tz(timezone).format("z")}
        
        { settings.updateFrequency==="weekly" && <React.Fragment>
            {" on "}<Select value={dayOfWeek}
              onChange={(event) => setBatchingDayOfWeek(event.target.value, timezone)}
            >
              <MenuItem value="Sunday">Sunday</MenuItem>
              <MenuItem value="Monday">Monday</MenuItem>
              <MenuItem value="Tuesday">Tuesday</MenuItem>
              <MenuItem value="Wednesday">Wednesday</MenuItem>
              <MenuItem value="Thursday">Thursday</MenuItem>
              <MenuItem value="Friday">Friday</MenuItem>
              <MenuItem value="Saturday">Saturday</MenuItem>
            </Select>
          </React.Fragment>
        }
      </React.Fragment>
    }
  </span>
  
  return <div className={classes.root}>
    <div className={classes.heading}>
      Vote and Reaction Notifications
    </div>
    <div className={classes.description}>
      Shows reactions, upvotes and downvotes on your posts and comments on top of the
      page. By default, this is on but only updates once per day, to avoid
      creating a distracting temptation to frequently recheck it.
    </div>
    <div className={classes.radioGroup}>
      {Object.entries(getKarmaNotificationTimingChoices()).map(([key, timingChoice]) =>
        <FormControlLabel
          key={key}
          control={
            <Radio
              checked={key===settings.updateFrequency}
              onChange={(ev) => modifyValue({updateFrequency: key as KarmaChangeUpdateFrequency})}
              className={classes.radioButton}
              value={key}
            />
          }
          label={
            <span className={classes.radioLabel}>
              {timingChoice.label}
              {(settings.updateFrequency === key) ? batchTimingChoices : null}
            </span>
          }
          classes={{
            label: null as any,
          }}
        />
      )}
    </div>

    {(settings.updateFrequency==="realtime") && (
      <div className={classes.warningText}>
        Warning: Immediate karma updates may lead to over-updating on tiny amounts
        of feedback, and to checking the site frequently when you'd rather be
        doing something else.
      </div>
    )}
    <FormControlLabel
      control={<Checkbox
        id="showNegativeCheckbox"
        classes={{root: classes.checkbox}}
        checked={settings.showNegativeKarma}
        onChange={(event, checked) => modifyValue({showNegativeKarma: checked})}
      />}
      label={
        <span className={classes.radioLabel}>
          Show negative karma notifications
        </span>
      }
      className={classes.showNegative}
    />
  </div>
};

export default registerComponent("KarmaChangeNotifierSettings", KarmaChangeNotifierSettings, {
  hocs: [withErrorBoundary]
});


