import { registerComponent } from '../../lib/vulcan-lib/components';
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

  return <time className={className} dateTime={dateTimeString}>{children}</time>
};

export default registerComponent('TimeTag', TimeTag);


