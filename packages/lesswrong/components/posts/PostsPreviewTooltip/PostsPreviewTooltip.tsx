import React, { FC } from "react";
import { Components } from "../../../lib/vulcan-lib";
import { isFriendlyUI } from "../../../themes/forumTheme";

export type PostsPreviewTooltipProps = {
  postsList?: boolean,
  hash?: string|null,
  post: PostsList|SunshinePostsList|null,
  comment?: CommentsList,
}

export const PostsPreviewTooltip: FC<PostsPreviewTooltipProps> = (props) =>
  isFriendlyUI
    ? <Components.EAPostsPreviewTooltip {...props} />
    : <Components.LWPostsPreviewTooltip {...props} />;
