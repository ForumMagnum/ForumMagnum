import React from 'react';
import { registerComponent, useStyles, Components } from '../../lib/vulcan-lib/components';
import { useFormComponentContext, formCommonStyles, LWForm } from './formUtil';
import type { KarmaChangeSettingsType } from '../../lib/collections/users/custom_fields';
import withErrorBoundary from '../common/withErrorBoundary';
import { useTimezone } from '../common/withTimezone';
import { convertTimeOfWeekTimezone } from '../../lib/utils/timeUtil';
import MenuItem from '@material-ui/core/MenuItem';
import Checkbox from '@material-ui/core/Checkbox';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Select from '@material-ui/core/Select';
import moment from '../../lib/moment-timezone';
import * as _ from 'underscore';

const styles = (theme: ThemeType): JssStyles => ({
  ...formCommonStyles(theme),
  
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
    paddingLeft: 2,
  },
});

export const karmaNotificationTimingChoices = {
  disabled: {
    label: "Disabled",
    infoText: "Karma changes are disabled",
    emptyText: "Karma changes are disabled"
  },
  daily: {
    label: "Batched daily (default)",
    infoText: "Karma Changes (batched daily):",
    emptyText: "No karma changes yesterday"
  },
  weekly: {
    label: "Batched weekly",
    infoText: "Karma Changes (batched weekly):",
    emptyText: "No karma changes last week"
  },
  realtime: {
    label: "Realtime",
    infoText: "Recent Karma Changes",
    emptyText: "No karma changes since you last checked"
  },
};

export function FormKarmaChangeNotifierSettings<T, FN extends keyof T>({form, fieldName}: {
  form: LWForm<T>,
  fieldName: NameOfFieldWithType<T,FN,KarmaChangeSettingsType>,
}) {
  const classes = useStyles(styles, "FormKarmaChangeNotifierSettings");
  const { timezone } = useTimezone();
  const {value,setValue} = useFormComponentContext<KarmaChangeSettingsType,T>(form, fieldName);
  const { Typography } = Components;
  
  const modifyValue = (changes: Partial<KarmaChangeSettingsType>) => {
    const oldSettings = value || {}
    setValue({ ...oldSettings, ...changes });
  }
  
  const setBatchingTimeOfDay = (timeOfDay: number, tz) => {
    const oldTimeLocalTZ = getBatchingTimeLocalTZ();
    const newTimeLocalTZ = {
      timeOfDay: timeOfDay,
      dayOfWeek: oldTimeLocalTZ.dayOfWeek
    };
    const newTimeGMT = convertTimeOfWeekTimezone(newTimeLocalTZ.timeOfDay, newTimeLocalTZ.dayOfWeek, tz, "GMT");
    
    modifyValue({
      timeOfDayGMT: newTimeGMT.timeOfDay,
      dayOfWeekGMT: newTimeGMT.dayOfWeek,
    });
  }
  
  const setBatchingDayOfWeek = (dayOfWeek: string, tz) => {
    const oldTimeLocalTZ = getBatchingTimeLocalTZ();
    const newTimeLocalTZ = {
      timeOfDay: oldTimeLocalTZ.timeOfDay,
      dayOfWeek: dayOfWeek
    };
    const newTimeGMT = convertTimeOfWeekTimezone(newTimeLocalTZ.timeOfDay, newTimeLocalTZ.dayOfWeek, tz, "GMT");
    
    modifyValue({
      timeOfDayGMT: newTimeGMT.timeOfDay,
      dayOfWeekGMT: newTimeGMT.dayOfWeek,
    });
  }
  
  const getBatchingTimeLocalTZ = () => {
    const settings = value || {}
    const { timeOfDayGMT, dayOfWeekGMT } = settings;
    const { timeOfDay, dayOfWeek } = convertTimeOfWeekTimezone(timeOfDayGMT, dayOfWeekGMT, "GMT", timezone);
    return { timeOfDay, dayOfWeek };
  }
  
  const settings = value || {}
  const {timeOfDay, dayOfWeek} = getBatchingTimeLocalTZ();
  
  const batchTimingChoices = <span>
    {(settings.updateFrequency==="daily" || settings.updateFrequency==="weekly") && <>
      {" at "}<Select
        value={timeOfDay}
        onChange={(event) => setBatchingTimeOfDay(parseInt(event.target.value), timezone)}
      >
        {_.range(24).map(hour =>
          <MenuItem key={hour} value={hour}>{hour}:00</MenuItem>
        )}
      </Select>
      
      {moment().tz(timezone).format("z")}
      
      {settings.updateFrequency==="weekly" && <>
        {" on "}
        <Select
          value={dayOfWeek}
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
      </>}
    </>}
  </span>
  
  return <div className={classes.formField}>
    <Typography variant="body1">
      Vote Notifications
    </Typography>
    <Typography variant="body2">
      Shows upvotes and downvotes to your posts and comments on top of the
      page. By default, this is on but only updates once per day, to avoid
      creating a distracting temptation to frequently recheck it. Can be
      set to real time (removing the batching), disabled (to remove it
      from the header entirely), or to some other update interval.
    </Typography>
    <RadioGroup className={classes.radioGroup}
      value={settings.updateFrequency}
      onChange={(event, newValue) => modifyValue({updateFrequency: newValue as any})}
    >
      {_.map(karmaNotificationTimingChoices, (timingChoice, key) =>
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
      <div className={classes.showNegative}>
        <Checkbox
          classes={{root: classes.checkbox}}
          checked={settings.showNegativeKarma}
          onChange={(event, checked) => modifyValue({showNegativeKarma: checked})}
        />
        <Typography variant="body2" className={classes.inline} component="label">
          Show negative karma notifications
        </Typography>
      </div>
    }
  </div>
}

registerComponent('FormKarmaChangeNotifierSettings', FormKarmaChangeNotifierSettings, {
  styles, hocs: [withErrorBoundary]
});
declare global {
  interface ComponentTypes {
    FormKarmaChangeNotifierSettings: typeof FormKarmaChangeNotifierSettings
  }
}
