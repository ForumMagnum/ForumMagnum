import React, { ReactNode, useCallback } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";

const PostsTooltip = ({post, postId, children}: {
  post?: PostsList | SunshinePostsList | null,
  postId?: string,
  children?: ReactNode,
}) => {
  const renderTitle = useCallback(() => {
    const {PostsPreviewTooltip, PostsPreviewTooltipSingle} = Components;
    if (post) {
      return (
        <PostsPreviewTooltip post={post} />
      );
    }
    if (postId) {
      return (
        <PostsPreviewTooltipSingle postId={postId} />
      );
    }
    return null;
  }, [post, postId]);

  const {LWTooltip} = Components;
  return (
    <LWTooltip
      title={renderTitle()}
      tooltip={false}
      hideOnTouchScreens
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
