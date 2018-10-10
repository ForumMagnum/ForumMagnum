import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import moment from 'moment-timezone';
import Tooltip from '@material-ui/core/Tooltip';
import withTimezone from '../common/withTimezone';

const CalendarDate = ({date, timezone}) => {
  return <span>{moment(new Date(date)).tz(timezone).calendar()}</span>
};

registerComponent('CalendarDate', CalendarDate, withTimezone);
