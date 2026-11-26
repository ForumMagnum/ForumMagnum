import React from 'react';
import type { TooltipPlacement } from "@/components/common/TooltipGroup";
import PostsTooltip from "./PostsPreviewTooltip/PostsTooltip";

/**
 * This is mostly deprecated - you should probably just use `PostsTooltip`
 * directly instead
 */
const PostsItemTooltipWrapper = ({
  children,
  post,
  placement="bottom-end",
  As="div",
  disabled,
  className,
}: {
  children?: React.ReactNode,
  post: PostsList,
  placement?: TooltipPlacement,
  As?: 'span' | 'div',
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

export default PostsItemTooltipWrapper;
