import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import moment from '../../lib/moment-timezone';
import { useTimezone } from '../common/withTimezone';
import { useCurrentTime } from '../../lib/utils/timeUtil';
import TimeTag from "../common/TimeTag";

function getDateFormat(dense: boolean, isThisYear: boolean): string {
  if (dense) {
    if (isThisYear) {
      return 'DD MMM'; // 5 Jan
    } else {
      return 'DD MMM YYYY'; // 5 Jan 2020
    }
  } else {
    if (isThisYear) {
      return 'dddd Do MMMM'; // Friday 5th January
    } else {
      return 'dddd Do MMMM YYYY'; // Friday 5th January 2020
    }
  }
}

const EventTime = ({post, dense=false}: {
  post: PostsBase,
  dense?: boolean,
}) => {
  const now = moment(useCurrentTime())
  const { timezone } = useTimezone();
  const start = post.startTime ? moment(post.startTime).tz(timezone) : undefined;
  const end = post.endTime ? moment(post.endTime).tz(timezone) : undefined;

  const isThisYear = now.isSame(start, 'year')

  // Date and time formats
  const timeFormat = 'h:mm a z'; // 11:30 am PDT
  const dateFormat = getDateFormat(dense, isThisYear);

  // Alternate formats omitting the timezone, for the start time in a
  // start-end range.
  const startTimeFormat = 'h:mm a'; // 11:30 am
  const calendarFormat = {sameElse: `${dateFormat}[ at ]${startTimeFormat}`};

  // Neither start nor end time specified
  if (!start && !end) {
    return <>TBD</>;
  }
  // Start time specified, end time missing. Use
  // moment.calendar, which has a bunch of its own special
  // cases like "tomorrow".
  // (Or vise versa. Specifying end time without specifying start time makes
  // less sense, but users can enter silly things.)
  else if (!start || !end) {
    const eventTime = start ? start : end;
    return eventTime ? <TimeTag dateTime={eventTime.toISOString()}>{eventTime!.calendar(calendarFormat)} {eventTime!.format('z')}</TimeTag> : <>TBD</>
  }
  // Both start end end time specified
  else {
    // If the start and end time are on the same date, render it like:
    //   January 15, 13:00 — 15:00 PDT
    // If they're on different dates, render it like:
    //   January 15, 19:00 to January 16 12:00 PDT
    // In both cases we avoid duplicating the timezone.
    if (start.format("YYYY-MM-DD") === end.format("YYYY-MM-DD")) {
      return <div>
        <TimeTag dateTime={start.toISOString()}>
          <div>{start.format(dateFormat)}</div>
          <div>{start.format(startTimeFormat) + ' – ' + end.format(timeFormat)}</div>
        </TimeTag>
      </div>
    } else {
      return (
        <span>
          <TimeTag dateTime={start.toISOString()}>{start.calendar({}, calendarFormat)}</TimeTag> to{" "}
          <TimeTag dateTime={end.toISOString()}>
            {end.calendar({}, calendarFormat)} {end.format("z")}
          </TimeTag>
        </span>
      );
    }
  }
};

export default registerComponent('EventTime', EventTime);



