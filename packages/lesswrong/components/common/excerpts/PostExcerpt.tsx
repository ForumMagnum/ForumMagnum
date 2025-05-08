import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { postGetPageUrl } from "../../../lib/collections/posts/helpers";
import { usePostContents } from "../../hooks/useForeignCrosspost";
import { useForeignApolloClient } from "../../hooks/useForeignApolloClient";
import { useSingle } from "../../../lib/crud/withSingle";
import { CommonExcerptProps, ContentExcerpt } from "./ContentExcerpt";
import { Loading } from "../../vulcan-core/Loading";

const isSunshine = (post: PostsList | SunshinePostsList): post is SunshinePostsList =>
  "user" in post;

const PostExcerptInner = ({
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
  // Get the post body, accounting for whether or not this is a crosspost
  const {postContents, loading, error} = usePostContents({
    post,
    fragmentName: isSunshine(post) ? "SunshinePostsList" : "PostsList",
    skip: !!hash,
  });

  // If a hash is supplied then we need to run a query to get the section
  // of the content starting at the hash, whether of not this is a crosspost
  const isForeign = post?.fmCrosspost?.isCrosspost &&
    !post.fmCrosspost.hostedHere &&
    !!post.fmCrosspost.foreignPostId;
  const foreignApolloClient = useForeignApolloClient();
  const {document: postHighlight, loading: loadingHighlight} = useSingle({
    collectionName: "Posts",
    fragmentName: "HighlightWithHash",
    documentId: post?.fmCrosspost?.foreignPostId ?? post?._id,
    skip: !hash && !!post.contents,
    fetchPolicy: "cache-first",
    extraVariables: {hash: "String"},
    extraVariablesValues: {hash},
    apolloClient: isForeign ? foreignApolloClient : undefined,
  });
  if ((loading && !hash) || (loadingHighlight && hash)) {
    return (
      <Loading />
    );
  }

  if (error) {
    // eslint-disable-next-line
    console.error("Error loading excerpt body:", error);
  }

  const customHighlight = post.customHighlight?.html;
  const postDefaultHighlight: string | undefined = postContents?.htmlHighlight || (postContents as AnyBecauseHard)?.html;

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

export const PostExcerpt = registerComponent(
  "PostExcerpt",
  PostExcerptInner,
);

declare global {
  interface ComponentTypes {
    PostExcerpt: typeof PostExcerpt,
  }
}
