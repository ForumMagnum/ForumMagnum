import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { postGetPageUrl } from "../../../lib/collections/posts/helpers";
import { useSingle } from "../../../lib/crud/withSingle";
import type { CommonExcerptProps } from "./ContentExcerpt";

const PostExcerpt = ({
  post,
  useCustomHighlight=true,
  hash,
  ...commonExcerptProps
}: CommonExcerptProps & {
  post: PostsList | SunshinePostsList,
  /** Whether to prefer showing `customHighlight` (can be set by admins) vs a snippet of the post body */
  useCustomHighlight?: boolean,
  hash?: string | null,
}) => {
  const {document: postHighlight, loading: loadingHighlight} = useSingle({
    collectionName: "Posts",
    fragmentName: "HighlightWithHash",
    documentId: post?.fmCrosspost?.foreignPostId ?? post?._id,
    skip: !hash && !!post.contents,
    fetchPolicy: "cache-first",
    extraVariables: {hash: "String"},
    extraVariablesValues: {hash},
  });

  const {Loading, ContentExcerpt} = Components;
  if (loadingHighlight && hash) {
    return (
      <Loading />
    );
  }

  const customHighlight = post.customHighlight?.html;
  const postDefaultHighlight: string | undefined = post.contents?.htmlHighlight || (post.contents as AnyBecauseHard)?.html;

  const contentHtml =
    postHighlight?.contents?.htmlHighlightStartingAtHash ||
    (useCustomHighlight && customHighlight ? customHighlight : postDefaultHighlight);
  if (!contentHtml) {
    return null;
  }

  return (
    <ContentExcerpt
      contentHtml={contentHtml}
      moreLink={postGetPageUrl(post)}
      contentType="postHighlight"
      {...commonExcerptProps}
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
