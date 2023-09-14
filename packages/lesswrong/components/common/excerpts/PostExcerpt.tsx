import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { postGetPageUrl } from "../../../lib/collections/posts/helpers";

const PostExcerpt = ({post, lines = 3, className}: {
  post: PostsList,
  lines?: number,
  className?: string,
}) => {
  const contentHtml = post.contents?.htmlHighlight;
  if (!contentHtml) {
    return null;
  }

  const {ContentExcerpt} = Components;
  return (
    <ContentExcerpt
      contentHtml={contentHtml}
      moreLink={postGetPageUrl(post)}
      contentType="postHighlight"
      lines={lines}
      className={className}
    />
  );
}

const PostExcerptComponent = registerComponent(
  "PostExcerpt",
  PostExcerpt,
);

declare global {
  interface ComponentTypes {
    PostExcerpt: typeof PostExcerptComponent,
  }
}
