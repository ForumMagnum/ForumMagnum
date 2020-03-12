import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import withHover from "../common/withHover";

interface ExternalProps {
  children?: React.ReactNode,
  post: PostsList,
}
interface PostsItemTooltipWrapperProps extends ExternalProps, WithHoverProps{
}

const PostsItemTooltipWrapper = ({hover, anchorEl, stopHover, children, post}: PostsItemTooltipWrapperProps) => {
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

const PostsItemTooltipWrapperComponent = registerComponent<ExternalProps>('PostsItemTooltipWrapper', PostsItemTooltipWrapper, {
  hocs: [
    withHover({pageElementContext: "postItemTooltip"}, ({post}) => ({postId: post?._id}))
  ]
})

declare global {
  interface ComponentTypes {
    PostsItemTooltipWrapper: typeof PostsItemTooltipWrapperComponent
  }
}

