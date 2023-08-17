import { PopperPlacementType } from '@material-ui/core/Popper';
import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useHover } from "../common/withHover";

const PostsItemTooltipWrapper = ({
  children,
  post,
  placement="bottom-end",
  As="div",
  className,
}: {
  children?: React.ReactNode,
  post: PostsList,
  placement?: PopperPlacementType,
  As?: keyof JSX.IntrinsicElements,
  className?: string,
}) => {
  const { LWPopper, PostsPreviewTooltip } = Components
  const {eventHandlers, hover, anchorEl} = useHover({
    pageElementContext: "postItemTooltip",
    postId: post?._id
  });
  return (
    <As {...eventHandlers} className={className}>
      <LWPopper
        open={hover}
        anchorEl={anchorEl}
        clickable={false}
        placement={placement}
      >
        <PostsPreviewTooltip post={post} postsList />
      </LWPopper>
      { children }
    </As>
  );
}

const PostsItemTooltipWrapperComponent = registerComponent('PostsItemTooltipWrapper', PostsItemTooltipWrapper
)

declare global {
  interface ComponentTypes {
    PostsItemTooltipWrapper: typeof PostsItemTooltipWrapperComponent
  }
}

