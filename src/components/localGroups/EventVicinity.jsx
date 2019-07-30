import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import Tooltip from '@material-ui/core/Tooltip';

const EventVicinity = ({post}) => {
  if (post.googleLocation && post.googleLocation.vicinity) {
    return <Tooltip title={post.location}>
        <span>{post.googleLocation.vicinity}</span>
      </Tooltip>
  } else {
    return <span>{post.location}</span>
  }
};

registerComponent('EventVicinity', EventVicinity)
