import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import withHover from "../common/withHover";

const PostsItemTooltipWrapper = ({hover, anchorEl, stopHover, children, post}) => {
  const { LWPopper, PostsPreviewTooltip } = Components
  return <React.Fragment>
      <LWPopper
        open={hover}
        anchorEl={anchorEl}
        onMouseEnter={stopHover}
        placement="left-start"
        modifiers={{
          flip: {
            behavior: ['left-start', 'bottom-end'],
            boundariesElement: 'viewport'
          }
        }}
      >
        <PostsPreviewTooltip post={post} />
      </LWPopper>
      { children }
    </React.Fragment>
}

registerComponent('PostsItemTooltipWrapper', PostsItemTooltipWrapper,
  withHover({pageElementContext: "postItemTooltip"}, ({post}) => ({postId: post?._id})))
