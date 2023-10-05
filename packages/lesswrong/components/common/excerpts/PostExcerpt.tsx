import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { postGetPageUrl } from "../../../lib/collections/posts/helpers";
import { usePostContents } from "../../hooks/useForeignCrosspost";

const PostExcerpt = ({post, lines = 3, hideMoreLink, className}: {
  post: PostsList | SunshinePostsList,
  lines?: number,
  hideMoreLink?: boolean,
  className?: string,
}) => {
  const {postContents, loading, error} = usePostContents({
    post: post as PostsList,
    fragmentName: "PostsList",
  });

  const {Loading, ContentExcerpt} = Components;
  if (loading) {
    return (
      <Loading />
    );
  }

  if (error) {
    // eslint-disable-next-line
    console.error("Error loading excerpt body:", error);
  }

  const contentHtml = postContents?.htmlHighlight;
  if (!contentHtml) {
    return null;
  }

  return (
    <ContentExcerpt
      contentHtml={contentHtml}
      moreLink={postGetPageUrl(post)}
      hideMoreLink={hideMoreLink}
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
