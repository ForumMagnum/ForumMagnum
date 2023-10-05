import React from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib";
import { isEAForum } from "../../../lib/instanceSettings";

export type PostsPreviewTooltipProps = {
  postsList?: boolean,
  hash?: string|null,
  post: PostsList|SunshinePostsList|null,
  comment?: AnyBecauseTodo,
}

const PostsPreviewTooltip = (props: PostsPreviewTooltipProps) =>
  isEAForum
    ? <Components.LWPostsPreviewTooltip {...props} />
    : <Components.LWPostsPreviewTooltip {...props} />;

const PostsPreviewTooltipComponent = registerComponent(
  "PostsPreviewTooltip",
  PostsPreviewTooltip,
);

declare global {
  interface ComponentTypes {
    PostsPreviewTooltip: typeof PostsPreviewTooltipComponent
  }
}
