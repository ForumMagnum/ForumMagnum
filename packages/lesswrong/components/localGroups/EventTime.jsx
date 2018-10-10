import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import moment from 'moment';
import withTimezone from '../common/withTimezone';

const EventTime = ({post, timezone}) => {
  const start = post.startTime ? moment(post.startTime).tz(timezone) : null;
  const end = post.endTime ? moment(post.endTime).tz(timezone) : null;
  
  const timeFormat = 'h:mm A z';
  const dateFormat = 'MMMM Do YY, '+timeFormat
  const calendarFormat = {sameElse : dateFormat}
  
  // Neither start nor end time specified
  if (!start && !end) {
    return "TBD";
  }
  // Start time specified, end time missing. Use
  // moment.calendar, which has a bunch of its own special
  // cases like "tomorrow".
  // (Or vise versa. Specifying end time without specifying start time makes
  // less sense, but users can enter silly things.)
  else if (!start || !end) {
    const eventTime = start ? start : end;
    return eventTime.calendar({}, calendarFormat)
  }
  // Both start end end time specified
  else {
    // If the start and end time are on the same date, render it like:
    //   January 15 13:00-15:00
    // If they're on different dates, render it like:
    //   January 15 19:00 to January 16 12:00
    if (start.format("YYYY-MM-DD") === end.format("YYYY-MM-DD")) {
      return start.format(dateFormat) + '-' + end.format(timeFormat);
    } else {
      return (<span>
        {start.calendar({}, calendarFormat)}
        to {end.calendar({}, calendarFormat)}
      </span>);
    }
  }
};

registerComponent('EventTime', EventTime, withTimezone);