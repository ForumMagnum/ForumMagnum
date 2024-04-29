import { registerComponent } from '../../lib/vulcan-lib';
import React, { ReactNode } from 'react';

/**
 * Wrapper around the html <time> element
 */
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

const TimeTagComponent = registerComponent('TimeTag', TimeTag);

declare global {
  interface ComponentTypes {
    TimeTag: typeof TimeTagComponent
  }
}
