import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { useContext } from 'react';
import moment from 'moment-timezone';
import { useTimezone } from '../common/withTimezone';
import { EnvironmentOverrideContext, useCurrentTime } from '../../lib/utils/timeUtil';
import { formatRelative } from '../../lib/utils/timeFormat';
import { LWTooltip } from "./LWTooltip";
import { TimeTag } from "./TimeTag";

export const ExpandedDate = ({date}: {date: Date | string}) => {
  return <FormatDate date={date} format={"LLL z"} />
};

/**
 * A relative time/date, like "4d". If tooltip is true (default), hover over
 * for the actual (non-relative) date/time.
 */
const FormatDateInner = ({date, format, includeAgo, tooltip=true, granularity="datetime", className}: {
  date: Date | string,
  format?: string,
  includeAgo?: boolean,
  tooltip?: React.ReactNode | boolean,
  /**
   * For the machine-readable (but not visible) datetime attribute that is set
   * on the <time> tag, whether to render as a full datetime or just a date
   * */
  granularity?: "date" | "datetime",
  className?: string
}) => {
  const now = useCurrentTime();
  const { timezone } = useTimezone();
  const { cacheFriendly=false } = useContext(EnvironmentOverrideContext);
  const dateToRender = date||now;
  const dateTimeAttr = granularity === "datetime" ? dateToRender : moment(dateToRender).tz(timezone).format("YYYY-MM-DD")
  let displayFormat = format;
  if (cacheFriendly && !format) {
    displayFormat = "MMM D YYYY"
    // hide the year if it's this year
    if (moment(now).isSame(moment(date), 'year')) {
      displayFormat = "MMM D"
    }
  }

  const formatted = (
    <TimeTag dateTime={dateTimeAttr} className={className}>
      {displayFormat ? moment(dateToRender).tz(timezone).format(displayFormat) : formatRelative(dateToRender, now, includeAgo)}
    </TimeTag>
  );

  if (tooltip) {
    return <LWTooltip title={
      (typeof tooltip === 'boolean'
        ? <ExpandedDate date={date}/>
        : tooltip)
    }>
      {formatted}
    </LWTooltip>
  } else {
    return formatted;
  }
};

export const FormatDate = registerComponent('FormatDate', FormatDateInner);

declare global {
  interface ComponentTypes {
    FormatDate: typeof FormatDate
  }
}
