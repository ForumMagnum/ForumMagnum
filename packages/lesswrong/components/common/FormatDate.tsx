import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';
import moment from '../../lib/moment-timezone';
import { useTimezone } from '../common/withTimezone';

export const ExpandedDate = ({date}: {date: Date}) => {
  const { timezone } = useTimezone();
  return <>{moment(new Date(date)).tz(timezone).format("LLL z")}</>
};

/// A relative time/date, like "4d". If tooltip is true (default), hover over
/// for the actual (non-relative) date/time.
const FormatDate = ({date, format, tooltip=true}: {
  date: Date,
  format?: string,
  tooltip?: boolean,
}) => {

  const { LWTooltip } = Components

  const formatted = (format
    ? <span>{moment(new Date(date)).format(format)}</span>
    : <span>{moment(new Date(date)).fromNow()}</span>
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
