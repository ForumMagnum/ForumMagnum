import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import type { Placement as PopperPlacementType } from "popper.js"
import { PostsTooltip } from "./PostsPreviewTooltip/PostsTooltip";

/**
 * This is mostly deprecated - you should probably just use `PostsTooltip`
 * directly instead
 */
const PostsItemTooltipWrapperInner = ({
  children,
  post,
  placement="bottom-end",
  As="div",
  disabled,
  className,
}: {
  children?: React.ReactNode,
  post: PostsList,
  placement?: PopperPlacementType,
  As?: keyof JSX.IntrinsicElements,
  disabled?: boolean,
  className?: string,
}) => {
  return (
    <PostsTooltip
      post={post}
      postsList
      placement={placement}
      pageElementContext="postItemTooltip"
      As={As}
      className={className}
      inlineBlock={false}
      disabled={disabled}
    >
      {children}
    </PostsTooltip>
  );
}

export const PostsItemTooltipWrapper = registerComponent('PostsItemTooltipWrapper', PostsItemTooltipWrapperInner
)

declare global {
  interface ComponentTypes {
    PostsItemTooltipWrapper: typeof PostsItemTooltipWrapper
  }
}

