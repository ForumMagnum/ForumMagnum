import React, { ReactNode, useCallback } from "react";
import type { Placement as PopperPlacementType } from "popper.js"
import { DialogueMessageInfo, PostsPreviewTooltip } from "./PostsPreviewTooltip";
import {
  DialogueMessagePreviewTooltip,
  PostsPreviewTooltipSingle,
  PostsPreviewTooltipSingleWithComment,
  TaggedPostTooltipSingle,
} from "./PostsPreviewTooltipSingle";
import HoverOver from "../../common/HoverOver";
import { AnalyticsProps } from "@/lib/analyticsEvents";

const PostsTooltip = ({
  post,
  postId,
  comment,
  commentId,
  tagRelId,
  dialogueMessageInfo,
  hash,
  postsList,
  inlineBlock=false,
  As,
  clickable,
  flip,
  placement,
  children,
  disabled,
  analyticsProps,
  className,
}: {
  post?: PostsList | SunshinePostsList | null,
  postId?: string,
  comment?: CommentsList,
  commentId?: string,
  tagRelId?: string,
  dialogueMessageInfo?: DialogueMessageInfo,
  hash?: string | null,
  postsList?: boolean,
  inlineBlock?: boolean,
  As?: keyof React.JSX.IntrinsicElements,
  clickable?: boolean,
  flip?: boolean,
  placement?: PopperPlacementType,
  children?: ReactNode,
  disabled?: boolean,
  analyticsProps?: AnalyticsProps,
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
      if (dialogueMessageInfo) {
        return <DialogueMessagePreviewTooltip postId={postId} dialogueMessageInfo={dialogueMessageInfo}/>
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
  }, [tagRelId, post, postId, postsList, comment, commentId, dialogueMessageInfo, hash]);

  if (disabled) {
    return <>
    {children}
    </>
  };
  return (
    <HoverOver
      title={renderTitle()}
      placement={placement}
      tooltip={false}
      hideOnTouchScreens
      inlineBlock={inlineBlock}
      As={As}
      clickable={clickable}
      flip={flip}
      analyticsProps={{
        ...analyticsProps,
        postId: postId ?? post?._id,
      }}
      className={className}
    >
      {children}
    </HoverOver>
  );
}

export default PostsTooltip;
