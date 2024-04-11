import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';
import moment from 'moment';
import { useTimezone } from '../common/withTimezone';
import { useCurrentTime } from '../../lib/utils/timeUtil';

export const ExpandedDate = ({date}: {date: Date | string}) => {
  const { timezone } = useTimezone();
  return <>{moment(new Date(date)).tz(timezone).format("LLL z")}</>
};

const formatRelative = (
  date: Date | string,
  now: Date,
  includeAgo?: boolean,
): string => {
  //const formatted = formatRelativeMoment(new Date(date), now);
  const formatted = formatRelativeFast(new Date(date), now);
  return includeAgo && formatted !== "now" ? formatted + " ago" : formatted;
}

const formatRelativeMoment = (date: Date, now: Date): string => {
  return moment(date).from(now);
}

const formatRelativeFast = (date: Date, now: Date): string => {
  const msApart = Math.abs(now.getTime() - date.getTime());
  const secondsApart = msApart / 1000;
  if (secondsApart < 44) {
    return "now";
  } else if (secondsApart < 45*60) {
    const minutes = Math.round(secondsApart/60.0);
    return `${minutes}m`;
  } else if (secondsApart < 22*60*60) {
    const hours = Math.round(secondsApart/(60.0*60.0));
    return `${hours}h`;
  } else if (secondsApart < 26*24*60*60) {
    const days = Math.round(secondsApart/(24*60*60.0));
    return `${days}d`;
  } else if (secondsApart < 335) {
    const months = Math.round(secondsApart/(30.4*24*60*60.0));
    return `${months}mo`;
  } else {
    const years = Math.round(secondsApart/(365*24*60*60.0));
    return `${years}y`;
  }
}

/// A relative time/date, like "4d". If tooltip is true (default), hover over
/// for the actual (non-relative) date/time.
const FormatDate = ({date, format, includeAgo, tooltip=true}: {
  date: Date | string,
  format?: string,
  includeAgo?: boolean,
  tooltip?: boolean,
}) => {
  const now = useCurrentTime();
  const dateToRender = date||now;
  const { LWTooltip } = Components

  const formatted: string = format
    ? moment(dateToRender).format(format)
    : formatRelative(dateToRender, now, includeAgo);

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
