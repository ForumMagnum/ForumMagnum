import React, { ReactNode, useCallback } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";

const PostsTooltip = ({postId, children}: {
  postId?: string,
  children?: ReactNode,
}) => {
  const {LWTooltip, PostsPreviewTooltip, PostsPreviewTooltipSingle} = Components;

  const renderTitle = useCallback(() => {
    if (postId) {
      return (
        <PostsPreviewTooltipSingle postId={postId} />
      );
    } else {
      return null;
    }
  }, [postId]);

  return (
    <LWTooltip
      title={renderTitle()}
      tooltip={false}
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
