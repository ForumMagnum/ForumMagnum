import React, { FC } from "react";
import { Components } from "../../../lib/vulcan-lib";
import { isEAForum } from "../../../lib/instanceSettings";

export type PostsPreviewTooltipProps = {
  postsList?: boolean,
  hash?: string|null,
  post: PostsList|SunshinePostsList|null,
  comment?: CommentsList,
}

export const PostsPreviewTooltip: FC<PostsPreviewTooltipProps> = (props) =>
  isEAForum
    ? <Components.EAPostsPreviewTooltip {...props} />
    : <Components.LWPostsPreviewTooltip {...props} />;
