import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import moment from 'moment-timezone';
import { useTimezone } from '../common/withTimezone';

/// A date rendered with moment().calendar(). Includes a plethora of special
/// cases like "Yesterday at 1:00 PM", "Last Tuesday at 1:00 PM". Turns into a
/// more normal date (in locale format) if more than a week away.
const CalendarDate = ({date}) => {
  const { timezone } = useTimezone();
  return <span>{moment(new Date(date)).tz(timezone).calendar()}</span>
};

registerComponent('CalendarDate', CalendarDate);
