import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import withHover from '../common/withHover';

const EventVicinity = ({post, hover, anchorEl, stopHover}) => {
  const { LWPopper } = Components
  if (post.googleLocation && post.googleLocation.vicinity) {
    return <span>
      <LWPopper 
        open={hover}
        anchorEl={anchorEl}
        onMouseEnter={stopHover}
        placement="top"
        tooltip
      >
        {post.location}
      </LWPopper>
      {post.googleLocation.vicinity}
    </span>
  } else {
    return <span>{post.location}</span>
  }
};

registerComponent('EventVicinity', EventVicinity, withHover)
