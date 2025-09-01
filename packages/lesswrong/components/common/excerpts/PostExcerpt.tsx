import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { postGetPageUrl } from "../../../lib/collections/posts/helpers";
import { useSingle } from "../../../lib/crud/withSingle";
import ContentExcerpt, { CommonExcerptProps } from "./ContentExcerpt";
import Loading from "../../vulcan-core/Loading";

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

export default registerComponent(
  "PostExcerpt",
  PostExcerpt,
);


