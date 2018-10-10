import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import moment from 'moment-timezone';
import Tooltip from '@material-ui/core/Tooltip';
import withTimezone from '../common/withTimezone';

/// A simple date, with no special cases, like "Jan 1, 2020". Hover over to
/// also see the time.
const SimpleDate = ({date, timezone}) => {
  return <Tooltip title={moment(new Date(date)).tz(timezone).format('LLL z')}>
      <span>{moment(new Date(date)).format("MMM DD, YYYY")}</span>
  </Tooltip>
};

registerComponent('SimpleDate', SimpleDate, withTimezone);

