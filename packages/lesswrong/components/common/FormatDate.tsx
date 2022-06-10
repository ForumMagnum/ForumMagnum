import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';
import moment from '../../lib/moment-timezone';
import { useTimezone } from '../common/withTimezone';
import { useCurrentTime } from '../../lib/utils/timeUtil';

export const ExpandedDate = ({date}: {date: Date | string}) => {
  const { timezone } = useTimezone();
  return <>{moment(new Date(date)).tz(timezone).format("LLL z")}</>
};

/// A relative time/date, like "4d". If tooltip is true (default), hover over
/// for the actual (non-relative) date/time.
const FormatDate = ({date, format, tooltip=true}: {
  date: Date | string,
  format?: string,
  tooltip?: boolean,
}) => {
  const now = useCurrentTime();
  const dateToRender = date||now;
  const { LWTooltip } = Components

  const formatted: string = (format
    ? moment(dateToRender).format(format)
    : moment(dateToRender).from(now)
  );
  
  if (tooltip) {
    return <LWTooltip title={<ExpandedDate date={date}/>}>
      {formatted}
    </LWTooltip>
  } else {
    return <>{formatted}</>
  }
};

const FormatDateComponent = registerComponent('FormatDate', FormatDate);

declare global {
  interface ComponentTypes {
    FormatDate: typeof FormatDateComponent
  }
}
