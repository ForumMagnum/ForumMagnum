import React, { FC } from "react";
import { Components } from "../../../lib/vulcan-lib/components";
import { isFriendlyUI } from "../../../themes/forumTheme";
import LWPostsPreviewTooltip from "@/components/posts/PostsPreviewTooltip/LWPostsPreviewTooltip";
import EAPostsPreviewTooltip from "@/components/posts/PostsPreviewTooltip/EAPostsPreviewTooltip";

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
