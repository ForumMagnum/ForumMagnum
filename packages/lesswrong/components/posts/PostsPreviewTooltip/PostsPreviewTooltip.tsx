import React, { FC } from "react";
import { isFriendlyUI } from "../../../themes/forumTheme";
import EAPostsPreviewTooltip from "./EAPostsPreviewTooltip";
import LWPostsPreviewTooltip from "./LWPostsPreviewTooltip";

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
    ? <EAPostsPreviewTooltip {...props} />
    : <LWPostsPreviewTooltip {...props} />;
