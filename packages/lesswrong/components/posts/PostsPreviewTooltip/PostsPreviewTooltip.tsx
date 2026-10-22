import React, { FC } from "react";
import LWPostsPreviewTooltip from "./LWPostsPreviewTooltip";

export interface DialogueMessageInfo {
  dialogueMessageId: string
  dialogueMessageContents: string
}

export interface PostsPreviewTooltipProps {
  postsList?: boolean,
  showLlmScore?: boolean,
  hash?: string|null,
  post: PostsList|SunshinePostsList|null,
  comment?: CommentsList,
  dialogueMessageInfo?: DialogueMessageInfo,
}

export const PostsPreviewTooltip: FC<PostsPreviewTooltipProps> = (props) =>
    <LWPostsPreviewTooltip {...props} />;
