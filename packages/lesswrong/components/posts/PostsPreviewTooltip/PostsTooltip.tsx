import React, { ReactNode, useCallback } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import type { PopperPlacementType } from "@material-ui/core/Popper/Popper";
import { PostsPreviewTooltip } from "./PostsPreviewTooltip";
import {
  DialogueMessagePreviewTooltip,
  PostsPreviewTooltipSingle,
  PostsPreviewTooltipSingleWithComment,
  TaggedPostTooltipSingle,
} from "./PostsPreviewTooltipSingle";
import { isEAForum } from "../../../lib/instanceSettings";

const PostsTooltip = ({
  post,
  postId,
  comment,
  commentId,
  tagRelId,
  dialogueMessageId,
  hash,
  postsList,
  inlineBlock=false,
  As,
  clickable,
  flip,
  placement,
  children,
  pageElementContext,
  pageElementSubContext,
  className,
}: {
  post?: PostsList | SunshinePostsList | null,
  postId?: string,
  comment?: CommentsList,
  commentId?: string,
  tagRelId?: string,
  dialogueMessageId?: string,
  hash?: string | null,
  postsList?: boolean,
  inlineBlock?: boolean,
  As?: keyof JSX.IntrinsicElements,
  clickable?: boolean,
  flip?: boolean,
  placement?: PopperPlacementType,
  children?: ReactNode,
  pageElementContext?: string,
  pageElementSubContext?: string,
  className?: string,
}) => {
  const renderTitle = useCallback(() => {
    if (tagRelId) {
      return (
        <TaggedPostTooltipSingle tagRelId={tagRelId} />
      );
    }
    if (post) {
      return (
        <PostsPreviewTooltip
          post={post}
          postsList={postsList}
          comment={comment}
          hash={hash}
        />
      );
    }

    if (postId) {
      if (dialogueMessageId) {
        return <DialogueMessagePreviewTooltip postId={postId} dialogueMessageId={dialogueMessageId}/>
      }

      const actualCommentId = commentId ?? comment?._id;
      return actualCommentId
        ? (
          <PostsPreviewTooltipSingleWithComment
            postId={postId}
            commentId={actualCommentId}
          />
        )
        : (
          <PostsPreviewTooltipSingle
            postId={postId}
            postsList={postsList}
          />
        );
    }
    return null;
  }, [tagRelId, post, postId, postsList, comment, commentId, dialogueMessageId, hash]);

  const {EAHoverOver, LWTooltip} = Components;
  const Tooltip = isEAForum ? EAHoverOver : LWTooltip;
  return (
    <Tooltip
      title={renderTitle()}
      placement={placement}
      tooltip={false}
      hideOnTouchScreens
      inlineBlock={inlineBlock}
      As={As}
      clickable={clickable}
      flip={flip}
      analyticsProps={{
        pageElementContext,
        pageElementSubContext,
        postId: postId ?? post?._id,
      }}
      className={className}
    >
      {children}
    </Tooltip>
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
