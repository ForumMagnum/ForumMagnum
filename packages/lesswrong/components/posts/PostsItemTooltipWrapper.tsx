import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import type { PopperPlacementType } from '@material-ui/core/Popper';

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
  const {PostsTooltip} = Components;
  return (
    <As className={className}>
      <PostsTooltip
        post={post}
        postsList
        placement={placement}
        pageElementContext="postItemTooltip"
      >
        {children}
      </PostsTooltip>
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

