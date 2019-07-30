import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import moment from 'moment-timezone';
import Tooltip from '@material-ui/core/Tooltip';
import withTimezone from '../common/withTimezone';

export const ExpandedDate = withTimezone(
  ({date, timezone}) =>
    moment(new Date(date)).tz(timezone).format("LLL z")
);

/// A relative time/date, like "4d". If tooltip is true (default), hover over
/// for the actual (non-relative) date/time.
const FormatDate = ({date, format, tooltip=true}) => {
  const formatted = (format
    ? <span>{moment(new Date(date)).format(format)}</span>
    : <span>{moment(new Date(date)).fromNow()}</span>
  );
  
  if (tooltip) {
    return <Tooltip title={<ExpandedDate date={date}/>}>
      {formatted}
    </Tooltip>
  } else {
    return formatted;
  }
};

registerComponent('FormatDate', FormatDate);
