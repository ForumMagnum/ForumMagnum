import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import moment from 'moment';
import Tooltip from '@material-ui/core/Tooltip';

const FromNowDate = ({date}) => {
  return <Tooltip title={moment(new Date(date)).format('LLL')}>
      <span>{moment(new Date(date)).fromNow()}</span>
  </Tooltip>
};

registerComponent('FromNowDate', FromNowDate);
