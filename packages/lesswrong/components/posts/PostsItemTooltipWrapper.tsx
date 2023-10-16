import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import type { PopperPlacementType } from '@material-ui/core/Popper';

/**
 * This is mostly deprecated - you should probably just use `PostsTooltip`
 * directly instead
 */
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
    <PostsTooltip
      post={post}
      postsList
      placement={placement}
      pageElementContext="postItemTooltip"
      As={As}
      className={className}
      inlineBlock={false}
    >
      {children}
    </PostsTooltip>
  );
}

const PostsItemTooltipWrapperComponent = registerComponent('PostsItemTooltipWrapper', PostsItemTooltipWrapper
)

declare global {
  interface ComponentTypes {
    PostsItemTooltipWrapper: typeof PostsItemTooltipWrapperComponent
  }
}

