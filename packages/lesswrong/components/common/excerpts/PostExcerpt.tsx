import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { postGetPageUrl } from "../../../lib/collections/posts/helpers";
import { usePostContents } from "../../hooks/useForeignCrosspost";
import { useForeignApolloClient } from "../../hooks/useForeignApolloClient";
import { useSingle } from "../../../lib/crud/withSingle";
import type { CommonExcerptProps } from "./ContentExcerpt";

const PostExcerpt = ({
  post,
  hash,
  ...commonExcerptProps
}: CommonExcerptProps & {
  post: PostsList | SunshinePostsList,
  hash?: string | null,
}) => {
  // Get the post body, accounting for whether or not this is a crosspost
  const {postContents, loading, error} = usePostContents({
    post: post as PostsList,
    fragmentName: "PostsList",
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

  const {Loading, ContentExcerpt} = Components;
  if ((loading && !hash) || (loadingHighlight && hash)) {
    return (
      <Loading />
    );
  }

  if (error) {
    // eslint-disable-next-line
    console.error("Error loading excerpt body:", error);
  }

  const contentHtml =
    postHighlight?.contents?.htmlHighlightStartingAtHash ||
    post.customHighlight?.html ||
    postContents?.htmlHighlight;
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
