import { Components as C, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import moment from 'moment';

const FromDate = ({date}) => {
  return <C.LWTooltip title={moment(new Date(date)).format('LLL')}>
      <span>{moment(new Date(date)).fromNow()}</span>
  </C.LWTooltip>
};

registerComponent('FromDate', FromDate);
