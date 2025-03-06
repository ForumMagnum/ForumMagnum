import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import type { PopperPlacementType } from '@material-ui/core/Popper';
import PostsTooltip from "@/components/posts/PostsPreviewTooltip/PostsTooltip";

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

const PostsItemTooltipWrapperComponent = registerComponent('PostsItemTooltipWrapper', PostsItemTooltipWrapper
)

declare global {
  interface ComponentTypes {
    PostsItemTooltipWrapper: typeof PostsItemTooltipWrapperComponent
  }
}

export default PostsItemTooltipWrapperComponent;

