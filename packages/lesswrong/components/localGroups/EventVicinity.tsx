import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useHover } from '../common/withHover';
import { LWPopper } from "../common/LWPopper";

const EventVicinityInner = ({post}: {
  post: PostsBase
}) => {
  const { eventHandlers, hover, anchorEl } = useHover();
  if (post.googleLocation && post.googleLocation.vicinity) {
    return <span {...eventHandlers}>
      <LWPopper 
        open={hover}
        anchorEl={anchorEl}
        clickable={false}
        placement="top"
        tooltip
      >
        {post.location}
      </LWPopper>
      {post.googleLocation.vicinity}
    </span>
  } else {
    return <span {...eventHandlers}>{post.location}</span>
  }
};

export const EventVicinity = registerComponent('EventVicinity', EventVicinityInner, {})

declare global {
  interface ComponentTypes {
    EventVicinity: typeof EventVicinity
  }
}

