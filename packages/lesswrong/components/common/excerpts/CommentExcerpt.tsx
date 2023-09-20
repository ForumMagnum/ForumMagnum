import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { commentGetPageUrlFromIds } from "../../../lib/collections/comments/helpers";

const CommentExcerpt = ({comment, lines = 3, className}: {
  comment: CommentsList|CommentsListWithParentMetadata,
  lines?: number,
  className?: string,
}) => {
  const contentHtml = comment.contents?.html;
  if (!contentHtml) {
    return null;
  }

  const {ContentExcerpt} = Components;
  return (
    <ContentExcerpt
      contentHtml={contentHtml}
      moreLink={commentGetPageUrlFromIds({
        commentId: comment._id,
        postId: comment.postId,
        postSlug: "postSlug" in comment ? comment.postSlug as string : undefined,
      })}
      contentType="comment"
      lines={lines}
      className={className}
    />
  );
}

const CommentExcerptComponent = registerComponent(
  "CommentExcerpt",
  CommentExcerpt,
);

declare global {
  interface ComponentTypes {
    CommentExcerpt: typeof CommentExcerptComponent,
  }
}
