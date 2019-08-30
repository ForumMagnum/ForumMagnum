import { registerComponent } from 'meteor/vulcan:core';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Checkbox from '@material-ui/core/Checkbox';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import withTimezone from '../common/withTimezone';
import moment from 'moment-timezone';

const styles = theme => ({
  radioGroup: {
    marginTop: 4,
    marginLeft: 12,
  },
  radioButton: {
    padding: 4,
  },
  inline: {
    display: "inline",
  },
  checkbox: {
    marginLeft: -10,
  }
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

class KarmaChangeNotifierSettings extends PureComponent {
  setUpdateFrequency = (updateFrequency) => {
    const oldSettings = this.props.value || {}
    const settings = { ...oldSettings, updateFrequency:updateFrequency };
    this.context.updateCurrentValues({
      [this.props.path]: settings
    });
  }
  
  setBatchingTimeOfDay = (timeOfDay, tz) => {
    const oldTimeLocalTZ = this.getBatchingTimeLocalTZ();
    const newTimeLocalTZ = {
      timeOfDay: timeOfDay,
      dayOfWeek: oldTimeLocalTZ.dayOfWeek
    };
    const newTimeGMT = this.convertTimezone(newTimeLocalTZ.timeOfDay, newTimeLocalTZ.dayOfWeek, tz, "GMT");
    
    const oldSettings = this.props.value || {}
    const newSettings = {
      ...oldSettings,
      timeOfDayGMT: newTimeGMT.timeOfDay,
      dayOfWeekGMT: newTimeGMT.dayOfWeek,
    };
    this.context.updateCurrentValues({
      [this.props.path]: newSettings
    });
  }
  
  setBatchingDayOfWeek = (dayOfWeek, tz) => {
    const oldTimeLocalTZ = this.getBatchingTimeLocalTZ();
    const newTimeLocalTZ = {
      timeOfDay: oldTimeLocalTZ.timeOfDay,
      dayOfWeek: dayOfWeek
    };
    const newTimeGMT = this.convertTimezone(newTimeLocalTZ.timeOfDay, newTimeLocalTZ.dayOfWeek, tz, "GMT");
    
    const oldSettings = this.props.value || {}
    const newSettings = {
      ...oldSettings,
      timeOfDayGMT: newTimeGMT.timeOfDay,
      dayOfWeekGMT: newTimeGMT.dayOfWeek,
    };
    this.context.updateCurrentValues({
      [this.props.path]: newSettings
    });
  }

  setNegativeKarmaFilter = (value) => {
    const oldSettings = this.props.value || {}
    const newSettings = {
      ...oldSettings,
      showNegativeKarma: value
    }
    this.context.updateCurrentValues({
      [this.props.path]: newSettings
    })
  }
  
  // Given a time of day (number of hours, 0-24)
  convertTimezone = (timeOfDay, dayOfWeek, fromTimezone, toTimezone) => {
    let time = moment()
      .tz(fromTimezone)
      .day(dayOfWeek).hour(timeOfDay).minute(0)
      .tz(toTimezone);
    return {
      timeOfDay: time.hour(),
      dayOfWeek: time.format("dddd")
    };
  }
  
  getBatchingTimeLocalTZ = () => {
    const settings = this.props.value || {}
    const { timeOfDayGMT, dayOfWeekGMT } = settings;
    const { timeOfDay, dayOfWeek } = this.convertTimezone(timeOfDayGMT, dayOfWeekGMT, "GMT", this.props.timezone);
    return { timeOfDay, dayOfWeek };
  }
  
  render() {
    const { timezone, classes } = this.props;
    const settings = this.props.value || {}
    
    const {timeOfDay, dayOfWeek} = this.getBatchingTimeLocalTZ();
    
    return <div>
      <Typography variant="body2">
        Vote Notifications
      </Typography>
      <Typography variant="body1">
        Shows upvotes and downvotes to your posts and comments on top of the
        page. By default, this is on but only updates once per day, to avoid
        creating a distracting temptation to frequently recheck it. Can be
        set to real time (removing the batching), disabled (to remove it
        from the header entirely), or to some other update interval.
      </Typography>
      <RadioGroup className={classes.radioGroup}
        value={settings.updateFrequency}
        onChange={(event, newValue) => this.setUpdateFrequency(newValue)}
      >
        {_.map(karmaNotificationTimingChoices, (timingChoice, key) =>
          <FormControlLabel
            key={key}
            value={key}
            control={<Radio className={classes.radioButton} />}
            label={
              <Typography className={classes.inline} variant="body1" component="label">
                {timingChoice.label}
              </Typography>
            }
            classes={{
              label: null,
            }}
          />
        )}
      </RadioGroup>
      
      { (settings.updateFrequency==="daily" || settings.updateFrequency==="weekly") &&
        <Typography variant="body1">
          Batched updates occur at <Select
            value={timeOfDay}
            onChange={(event) => this.setBatchingTimeOfDay(event.target.value, timezone)}
          >
            { _.range(24).map(hour =>
                <MenuItem key={hour} value={hour}>{hour}:00</MenuItem>
              )
            }
            
          </Select>
          
          {moment().tz(timezone).format("z")}
          {" "}
          
          { settings.updateFrequency==="weekly" && <span>
              on <Select value={dayOfWeek}
                onChange={(event) => this.setBatchingDayOfWeek(event.target.value, timezone)}
              >
                <MenuItem value="Sunday">Sunday</MenuItem>
                <MenuItem value="Monday">Monday</MenuItem>
                <MenuItem value="Tuesday">Tuesday</MenuItem>
                <MenuItem value="Wednesday">Wednesday</MenuItem>
                <MenuItem value="Thursday">Thursday</MenuItem>
                <MenuItem value="Friday">Friday</MenuItem>
                <MenuItem value="Saturday">Saturday</MenuItem>
              </Select>
            </span>
          }
        </Typography>
      }
      { (settings.updateFrequency==="realtime") && <span>
        Warning: Immediate karma updates may lead to over-updating on tiny amounts
        of feedback, and to checking the site frequently when you'd rather be
        doing something else.
      </span> }
      {
        <div>
          <Checkbox
            classes={{root: classes.checkbox}}
            checked={settings.showNegativeKarma}
            onChange={(event, checked) => this.setNegativeKarmaFilter(checked)}
          />
          <Typography variant="body1" className={classes.inline} component="label">
            Show negative karma notifications
          </Typography>
        </div>
      }
    </div>
  }
}

KarmaChangeNotifierSettings.contextTypes = {
  updateCurrentValues: PropTypes.func,
};

registerComponent("KarmaChangeNotifierSettings", KarmaChangeNotifierSettings,
  withStyles(styles, {name: "KarmaChangeNotifierSettings"}),
  withTimezone);