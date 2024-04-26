import moment from 'moment';
import { registerComponent } from '../../lib/vulcan-lib';
import React, { ReactNode } from 'react';
import { useTimezone } from './withTimezone';

const TimeTag = ({dateTime, children, className}: {
  dateTime: Date | string,
  children: ReactNode,
  className?: string
}) => {
  const dateTimeString = typeof dateTime === 'string' ? dateTime : dateTime.toISOString();

  // Cached SSRs may produce a value for `children` that isn't quite correct (e.g. "5m ago", or a different date
  // due to timezone differences). Currently we handle this by just allowing it to be wrong for a split second and
  // letting hydration fix it, so we want to suppress the hydration warning
  return <time className={className} dateTime={dateTimeString} suppressHydrationWarning>{children}</time>
};

const FormatTimeTag = ({dateTime, format, className}: {
  dateTime: Date | string,
  format: string,
  className?: string
}) => {
  const { timezone } = useTimezone()
  const contents = moment(new Date(dateTime)).tz(timezone).format(format)

  return <TimeTag className={className} dateTime={dateTime}>{contents}</TimeTag>
};

const TimeTagComponent = registerComponent('TimeTag', TimeTag);
const FormatTimeTagComponent = registerComponent('FormatTimeTag', FormatTimeTag);

declare global {
  interface ComponentTypes {
    TimeTag: typeof TimeTagComponent
    FormatTimeTag: typeof FormatTimeTagComponent
  }
}
