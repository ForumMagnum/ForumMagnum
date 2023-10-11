import React, { ReactNode, useCallback } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import type { PopperPlacementType } from "@material-ui/core/Popper/Popper";

const PostsTooltip = ({
  post,
  postId,
  comment,
  commentId,
  tagRelId,
  hash,
  postsList,
  inlineBlock,
  clickable,
  flip,
  placement,
  children,
  pageElementContext,
  pageElementSubContext,
}: {
  post?: PostsList | SunshinePostsList | null,
  postId?: string,
  comment?: CommentsList,
  commentId?: string,
  tagRelId?: string,
  hash?: string | null,
  postsList?: boolean,
  inlineBlock?: boolean,
  clickable?: boolean,
  flip?: boolean,
  placement?: PopperPlacementType,
  children?: ReactNode,
  pageElementContext?: string,
  pageElementSubContext?: string,
}) => {
  const renderTitle = useCallback(() => {
    const {
      TaggedPostTooltipSingle,
      PostsPreviewTooltip,
      PostsPreviewTooltipSingle,
      PostsPreviewTooltipSingleWithComment,
    } = Components;
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
  }, [tagRelId, post, postId, postsList, comment, commentId, hash]);

  const {LWTooltip} = Components;
  return (
    <LWTooltip
      title={renderTitle()}
      placement={placement}
      tooltip={false}
      hideOnTouchScreens
      inlineBlock={inlineBlock}
      clickable={clickable}
      flip={flip}
      pageElementContext={pageElementContext}
      pageElementSubContext={pageElementSubContext}
      analyticsProps={{postId: postId ?? post?._id}}
    >
      {children}
    </LWTooltip>
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
