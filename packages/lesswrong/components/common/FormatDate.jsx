import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import moment from 'moment-timezone';
import Tooltip from '@material-ui/core/Tooltip';
import withTimezone from '../common/withTimezone';

const ExpandedDate = withTimezone(
  ({date, timezone}) =>
    moment(new Date(date)).tz(timezone).format("LLL z")
);

/// A relative time/date, like "4d". Hover over for the actual (non-relative)
/// date/time.
const FormatDate = ({date, timezone, format}) => {
  return <Tooltip title={<ExpandedDate date={date} timezone={timezone}/>}>
    {format ?
      <span>{moment(new Date(date)).format(format)}</span>
      :
      <span>{moment(new Date(date)).fromNow()}</span>
    }
  </Tooltip>
};

registerComponent('FormatDate', FormatDate);
