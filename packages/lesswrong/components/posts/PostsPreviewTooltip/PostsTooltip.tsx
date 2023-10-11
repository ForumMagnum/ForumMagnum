import React, { ReactNode, useCallback } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import type { PopperPlacementType } from "@material-ui/core/Popper/Popper";

const PostsTooltip = ({
  post,
  postId,
  postsList,
  inlineBlock,
  clickable,
  flip,
  placement,
  children,
}: {
  post?: PostsList | SunshinePostsList | null,
  postId?: string,
  postsList?: boolean,
  inlineBlock?: boolean,
  clickable?: boolean,
  flip?: boolean,
  placement?: PopperPlacementType,
  children?: ReactNode,
}) => {
  const renderTitle = useCallback(() => {
    const {PostsPreviewTooltip, PostsPreviewTooltipSingle} = Components;
    if (post) {
      return (
        <PostsPreviewTooltip post={post} postsList={postsList} />
      );
    }
    if (postId) {
      return (
        <PostsPreviewTooltipSingle postId={postId} postsList={postsList} />
      );
    }
    return null;
  }, [post, postId, postsList]);

  const {LWTooltip} = Components;
  return (
    <LWTooltip
      title={renderTitle()}
      placement={placement}
      tooltip={false}
      hideOnTouchScreens
      inlineBlock={inlineBlock}
      clickable={clickable}
      flip={flip}
    >
      {children}
    </LWTooltip>
  );
}

const PostsTooltipComponent = registerComponent(
  "PostsTooltip",
  PostsTooltip,
);

declare global {
  interface ComponentTypes {
    PostsTooltip: typeof PostsTooltipComponent
  }
}
