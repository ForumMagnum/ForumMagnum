import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';
import moment from 'moment';
import { useTimezone } from '../common/withTimezone';
import { useCurrentTime } from '../../lib/utils/timeUtil';
import { formatRelative } from '../../lib/utils/timeFormat';

export const ExpandedDate = ({date}: {date: Date | string}) => {
  const { FormatDate } = Components
  return <FormatDate date={date} format={"LLL z"} />
};

/**
 * A relative time/date, like "4d". If tooltip is true (default), hover over
 * for the actual (non-relative) date/time.
 */
const FormatDate = ({date, format, includeAgo, tooltip=true, granularity="datetime", className}: {
  date: Date | string,
  format?: string,
  includeAgo?: boolean,
  tooltip?: boolean,
  /**
   * For the machine-readable (but not visible) datetime attribute that is set
   * on the <time> tag, whether to render as a full datetime or just a date
   * */
  granularity?: "date" | "datetime",
  className?: string
}) => {
  const now = useCurrentTime();
  const { timezone } = useTimezone();
  const dateToRender = date||now;
  const dateTimeAttr = granularity === "datetime" ? dateToRender : moment(dateToRender).tz(timezone).format("YYYY-MM-DD")
  const { LWTooltip, TimeTag } = Components

  const formatted = (
    <TimeTag dateTime={dateTimeAttr} className={className}>
      {format ? moment(dateToRender).tz(timezone).format(format) : formatRelative(dateToRender, now, includeAgo)}
    </TimeTag>
  );

  if (tooltip) {
    return <LWTooltip title={<ExpandedDate date={date}/>}>
      {formatted}
    </LWTooltip>
  } else {
    return formatted;
  }
};

const FormatDateComponent = registerComponent('FormatDate', FormatDate);

declare global {
  interface ComponentTypes {
    FormatDate: typeof FormatDateComponent
  }
}
