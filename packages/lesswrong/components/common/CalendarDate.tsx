import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import moment from '../../lib/moment-timezone';
import { useTimezone } from '../common/withTimezone';

/**
 * A date rendered with moment().calendar(). Includes a plethora of special
 * cases like "Yesterday at 1:00 PM", "Last Tuesday at 1:00 PM". Turns into a
 * more normal date (in locale format) if more than a week away.
 */
const CalendarDateInner = ({date}: {
  date: Date | string,
}) => {
  const { TimeTag } = Components;

  const { timezone } = useTimezone();
  return <TimeTag dateTime={date}>{moment(new Date(date)).tz(timezone).calendar()}</TimeTag>
};

export const CalendarDate = registerComponent('CalendarDate', CalendarDateInner);

declare global {
  interface ComponentTypes {
    CalendarDate: typeof CalendarDate
  }
}
