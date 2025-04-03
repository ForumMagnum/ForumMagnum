import React, { ReactNode, useCallback } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import type { PopperPlacementType } from "@/lib/vendor/@material-ui/core/src/Popper/Popper";
import { DialogueMessageInfo, PostsPreviewTooltip } from "./PostsPreviewTooltip";
import {
  DialogueMessagePreviewTooltip,
  PostsPreviewTooltipSingle,
  PostsPreviewTooltipSingleWithComment,
  TaggedPostTooltipSingle,
} from "./PostsPreviewTooltipSingle";

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
  pageElementContext,
  pageElementSubContext,
  disabled,
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
  As?: keyof JSX.IntrinsicElements,
  clickable?: boolean,
  flip?: boolean,
  placement?: PopperPlacementType,
  children?: ReactNode,
  pageElementContext?: string,
  pageElementSubContext?: string,
  //bypasses the component and just returns the children
  disabled?: boolean,
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

  const {HoverOver} = Components;
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
        pageElementContext,
        pageElementSubContext,
        postId: postId ?? post?._id,
      }}
      className={className}
    >
      {children}
    </HoverOver>
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
