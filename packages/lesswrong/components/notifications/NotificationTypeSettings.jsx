import React, { PureComponent } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import withErrorBoundary from '../common/withErrorBoundary';
import PropTypes from 'prop-types';

const styles = theme => ({
  label: {
  },
})

const defaultValue = {
  channel: "none",
  batchingFrequency: "realtime",
  timeOfDayGMT: 12,
  dayOfWeekGMT: "Monday",
};

const NotificationTypeSettings = ({ path, value, label, classes }, context) => {
  const { BatchTimePicker } = Components;
  const currentValue = { ...defaultValue, ...value };
  
  const modifyValue = (changes) => {
    context.updateCurrentValues({
      [path]: { ...currentValue, ...changes }
    });
  }
  
  return <div>
    <div>
      <span className={classes.label}>{label}: </span>
      <Select
        value={currentValue.channel}
        onChange={(event) =>
          modifyValue({ channel: event.target.value })}
      >
        <MenuItem value="none">Don't notify</MenuItem>
        <MenuItem value="onsite">Notify me on-site</MenuItem>
        <MenuItem value="email">Notify me by email</MenuItem>
        <MenuItem value="both">Notify both on-site and by email</MenuItem>
      </Select>
      { currentValue.channel !== "none" && <span>
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
      </span>}
      { (currentValue.channel !== "none" && (currentValue.batchingFrequency==="daily" || currentValue.batchingFrequency==="weekly")) && <span>
        {" at "}
        <BatchTimePicker
          mode={currentValue.batchingFrequency}
          value={{timeOfDayGMT: currentValue.timeOfDayGMT, dayOfWeekGMT: currentValue.dayOfWeekGMT}}
          onChange={newBatchTime => modifyValue(newBatchTime)}
        />
      </span>}
    </div>
  </div>;
}


NotificationTypeSettings.contextTypes = {
  updateCurrentValues: PropTypes.func,
};

registerComponent('NotificationTypeSettings', NotificationTypeSettings,
  withErrorBoundary,
  withStyles(styles, {name:"NotificationTypeSettings"}));
