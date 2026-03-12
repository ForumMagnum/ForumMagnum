import React from "react";
import { commentGetPageUrlFromIds } from "../../../lib/collections/comments/helpers";
import ContentExcerpt, { CommonExcerptProps } from "./ContentExcerpt";

const CommentExcerpt = ({
  comment,
  ...commonExcerptProps
}: CommonExcerptProps & {
  comment: CommentsList|CommentsListWithParentMetadata,
}) => {
  const contentHtml = comment.contents?.html;
  if (!contentHtml) {
    return null;
  }
  return (
    <ContentExcerpt
      contentHtml={contentHtml}
      moreLink={commentGetPageUrlFromIds({
        commentId: comment._id,
        postId: comment.postId,
        postSlug: "postSlug" in comment ? comment.postSlug as string : undefined,
      })}
      contentType="comment"
      alwaysExpandInPlace
      {...commonExcerptProps}
    />
  );
}

export default CommentExcerpt;


