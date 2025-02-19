import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { commentGetPageUrlFromIds } from "../../../lib/collections/comments/helpers";
import type { CommonExcerptProps } from "./ContentExcerpt";

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
      alwaysExpandInPlace
      {...commonExcerptProps}
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
