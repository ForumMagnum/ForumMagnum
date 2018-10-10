import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import moment from 'moment';

const EventTime = ({post}) => {
  const start = post.startTime;
  const end = post.endTime;
  
  const timeFormat = 'h:mm A';
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
    return moment(eventTime).calendar({}, calendarFormat)
  }
  // Both start end end time specified
  else {
    // If the start and end time are on the same date, render it like:
    //   January 15 13:00-15:00
    // If they're on different dates, render it like:
    //   January 15 19:00 to January 16 12:00
    if (moment(start).format("YYYY-MM-DD") === moment(end).format("YYYY-MM-DD")) {
      return moment(start).format(dateFormat) + '-' + moment(end).format(timeFormat);
    } else {
      return (<span>
        <span>
          From: {moment(start).calendar({}, calendarFormat)}
        </span>
        <span>
          To: {moment(end).calendar({}, calendarFormat)}
        </span>
      </span>);
    }
  }
};

registerComponent('EventTime', EventTime);