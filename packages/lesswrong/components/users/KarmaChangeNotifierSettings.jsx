import { Components, registerComponent } from 'meteor/vulcan:core';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { karmaChangeNotifierDefaultSettings } from '../../lib/karmaChanges.js';

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
});

const karmaNotificationTimingChoices = {
  disabled: {
    label: "Disabled",
  },
  daily: {
    label: "Batched daily (default)",
  },
  weekly: {
    label: "Batched weekly",
  },
  realtime: {
    label: "Realtime",
  },
};

class KarmaChangeNotifierSettings extends PureComponent {
  setUpdateFrequency = (updateFrequency) => {
    const oldSettings = this.props.value || karmaChangeNotifierDefaultSettings;
    const settings = { ...oldSettings, updateFrequency:updateFrequency };
    this.context.updateCurrentValues({
      [this.props.path]: settings
    });
  }
  
  setTimeOfDay = (timeOfDay) => {
    const oldSettings = this.props.value || karmaChangeNotifierDefaultSettings;
    const settings = { ...oldSettings, timeOfDay: timeOfDay };
    this.context.updateCurrentValues({
      [this.props.path]: settings
    });
  }
  
  setDayOfWeek = (dayOfWeek) => {
    const oldSettings = this.props.value || karmaChangeNotifierDefaultSettings;
    const settings = { ...oldSettings, dayOfWeek: dayOfWeek };
    this.context.updateCurrentValues({
      [this.props.path]: settings
    });
  }
  
  render() {
    const { classes } = this.props;
    const settings = this.props.value || karmaChangeNotifierDefaultSettings;
    const { updateFrequency, timeOfDay, dayOfWeek } = settings;
    
    return <div>
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
        value={updateFrequency}
        onChange={(event, newValue) => this.setUpdateFrequency(newValue)}
      >
        {_.map(karmaNotificationTimingChoices, (timingChoice, key) =>
          <FormControlLabel
            key={key}
            value={key}
            control={<Radio className={classes.radioButton} />}
            label={
              <Typography className={classes.inline} variant="body2" component="label">
                {timingChoice.label}
              </Typography>
            }
            classes={{
              label: null,
            }}
          />
        )}
      </RadioGroup>
      
      <Typography variant="body2">
        Batched updates occur at <Select
          value={timeOfDay}
          onChange={(event) => this.setTimeOfDay(event.target.value)}
        >
          { _.range(24).map(hour =>
              <MenuItem key={hour} value={hour}>{hour}:00</MenuItem>
            )
          }
        </Select>
        { updateFrequency==="weekly" && <span>
            on <Select value={dayOfWeek}
              onChange={(event) => this.setDayOfWeek(event.target.value)}
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
    </div>
  }
}

KarmaChangeNotifierSettings.contextTypes = {
  updateCurrentValues: PropTypes.func,
};

registerComponent("KarmaChangeNotifierSettings", KarmaChangeNotifierSettings,
  withStyles(styles, {name: "KarmaChangeNotifierSettings"}));