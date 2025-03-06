import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useHover } from '../common/withHover';
import LWPopper from "@/components/common/LWPopper";

const EventVicinity = ({post}: {
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

const EventVicinityComponent = registerComponent('EventVicinity', EventVicinity, {})

declare global {
  interface ComponentTypes {
    EventVicinity: typeof EventVicinityComponent
  }
}

export default EventVicinityComponent;

