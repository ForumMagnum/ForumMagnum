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
        placement="bottom-end"
        modifiers={{
          flip: {
            enabled: false
          }
        }}
      >
        <PostsPreviewTooltip post={post} postsList />
      </LWPopper>
      { children }
    </React.Fragment>
}

const PostsItemTooltipWrapperComponent = registerComponent('PostsItemTooltipWrapper', PostsItemTooltipWrapper,
  withHover({pageElementContext: "postItemTooltip"}, ({post}) => ({postId: post?._id})))

declare global {
  interface ComponentTypes {
    PostsItemTooltipWrapper: typeof PostsItemTooltipWrapperComponent
  }
}

