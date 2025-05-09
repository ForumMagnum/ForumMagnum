import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { PureComponent } from 'react';
import Radio from '@/lib/vendor/@material-ui/core/src/Radio';
import RadioGroup from '@/lib/vendor/@material-ui/core/src/RadioGroup';
import FormControlLabel from '@/lib/vendor/@material-ui/core/src/FormControlLabel';
import Select from '@/lib/vendor/@material-ui/core/src/Select';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import { useTimezone } from '../common/withTimezone';
import withErrorBoundary from '../common/withErrorBoundary';
import moment from '../../lib/moment-timezone';
import { convertTimeOfWeekTimezone } from '../../lib/utils/timeUtil';
import { karmaChangeNotifierDefaultSettings, type KarmaChangeSettingsType } from '../../lib/collections/users/helpers';
import * as _ from 'underscore';
import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';
import { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { Typography } from "../common/Typography";
import { MenuItem } from "../common/Menus";

const styles = defineStyles('KarmaChangeNotifierSettings', (theme: ThemeType) => ({
  root: {
    paddingLeft: 8,
    paddingRight: 8,
  },
  heading: {
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
  },
  radioGroup: {
    marginTop: 4,
    paddingLeft: 24,
  },
  radioButton: {
    padding: 4,
  },
  inline: {
    display: "inline",
  },
  checkbox: {
    paddingRight: 4,
  },
  showNegative: {
    paddingLeft: 16,
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
      infoText: preferredHeadingCase("Karma Changes and Reacts (batched daily):"),
      emptyText: "No karma changes or reacts yesterday"
    },
    weekly: {
      label: "Batched weekly",
      infoText: preferredHeadingCase("Karma Changes and Reacts (batched weekly):"),
      emptyText: "No karma changes or reacts last week"
    },
    realtime: {
      label: "Realtime",
      infoText: preferredHeadingCase("Recent Karma Changes and Reacts"),
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

const KarmaChangeNotifierSettingsInner = ({
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
          { _.range(24).map(hour =>
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
    <Typography variant="body1" className={classes.heading}>
      Vote and Reaction Notifications
    </Typography>
    <Typography variant="body2">
      Shows reactions, upvotes and downvotes on your posts and comments on top of the
      page. By default, this is on but only updates once per day, to avoid
      creating a distracting temptation to frequently recheck it. Can be
      set to real time (removing the batching), disabled (to remove it
      from the header entirely), or to some other update interval.
    </Typography>
    <RadioGroup className={classes.radioGroup}
      value={settings.updateFrequency}
      onChange={(event, newValue) => modifyValue({updateFrequency: newValue as any})}
    >
      {_.map(getKarmaNotificationTimingChoices(), (timingChoice, key) =>
        <FormControlLabel
          key={key}
          value={key}
          control={<Radio className={classes.radioButton} />}
          label={
            <Typography className={classes.inline} variant="body2" component="span">
              {timingChoice.label}
              {(settings.updateFrequency === key) ? batchTimingChoices : null}
            </Typography>
          }
          classes={{
            label: null as any,
          }}
        />
      )}
    </RadioGroup>
    
    { (settings.updateFrequency==="realtime") && <span>
      Warning: Immediate karma updates may lead to over-updating on tiny amounts
      of feedback, and to checking the site frequently when you'd rather be
      doing something else.
    </span> }
    {
      <FormControlLabel
        control={<Checkbox
          id="showNegativeCheckbox"
          classes={{root: classes.checkbox}}
          checked={settings.showNegativeKarma}
          onChange={(event, checked) => modifyValue({showNegativeKarma: checked})}
        />}
        label={
          <Typography variant="body2" className={classes.inline}>
            Show negative karma notifications
          </Typography>
        }
        className={classes.showNegative}
      />
    }
  </div>
};

export const KarmaChangeNotifierSettings = registerComponent("KarmaChangeNotifierSettings", KarmaChangeNotifierSettingsInner, {
  hocs: [withErrorBoundary]
});


