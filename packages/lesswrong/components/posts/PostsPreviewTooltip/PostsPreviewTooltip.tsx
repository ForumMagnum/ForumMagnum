import React, { FC } from "react";
import { Components } from "../../../lib/vulcan-lib/components";
import { isFriendlyUI } from "../../../themes/forumTheme";

export interface DialogueMessageInfo {
  dialogueMessageId: string
  dialogueMessageContents: string
}

export type PostsPreviewTooltipProps = {
  postsList?: boolean,
  hash?: string|null,
  post: PostsList|SunshinePostsList|null,
  comment?: CommentsList,
  dialogueMessageInfo?: DialogueMessageInfo,
}

export const PostsPreviewTooltip: FC<PostsPreviewTooltipProps> = (props) =>
  isFriendlyUI
    ? <Components.EAPostsPreviewTooltip {...props} />
    : <Components.LWPostsPreviewTooltip {...props} />;
