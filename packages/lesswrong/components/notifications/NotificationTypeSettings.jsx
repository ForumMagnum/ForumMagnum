import React, { PureComponent } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import Checkbox from '@material-ui/core/Checkbox';
import Select from '@material-ui/core/Select';

const styles = theme => ({
})

const batchingChoices = {
  daily: {
    label: "Daily",
  },
  weekly: {
    label: "Weekly",
  },
  realtime: {
    label: "Immediately",
  },
}

class NotificationTypeSettings extends PureComponent {
  modifyValue(changes) {
    this.context.updateCurrentValues({
      [this.props.path]: { ...this.props.value, ...changes }
    });
  }
  
  render() {
    const { value, path, label, classes } = this.props;
    
    return <div>
      {label}
      
      <div>
        <Checkbox
          checked={value.enabled}
          onChange={(event, checked) => this.modifyValue({ enabled: checked })}
        />
        {label}
      </div>
      <div>
        Notify me
        <Select value={value.channel}>
          <MenuItem value="onsite">on-site</MenuItem>
          <MenuItem value="email">by email</MenuItem>
        </Select>
        <Select value={value.batchingFrequency}>
          <MenuItem value="realtime">immediately</MenuItem>
          <MenuItem value="daily">daily</MenuItem>
          <MenuItem value="weekly">weekly</MenuItem>
        </Select>
      </div>
    </div>;
  }
}

registerComponent('NotificationTypeSettings', NotificationTypeSettings,
  withStyles(styles, {name:"NotificationTypeSettings"}));