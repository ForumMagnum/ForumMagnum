import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import moment from 'moment-timezone';
import Tooltip from '@material-ui/core/Tooltip';
import withTimezone from '../common/withTimezone';

const FromNowDate = ({date, timezone}) => {
  return <Tooltip title={moment(new Date(date)).tz(timezone).format('LLL z')}>
      <span>{moment(new Date(date)).fromNow()}</span>
  </Tooltip>
};

registerComponent('FromNowDate', FromNowDate, withTimezone);
