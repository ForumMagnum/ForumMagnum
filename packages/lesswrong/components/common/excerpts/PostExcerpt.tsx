import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { postGetPageUrl } from "../../../lib/collections/posts/helpers";
import { usePostContents } from "../../hooks/useForeignCrosspost";
import { useForeignApolloClient } from "../../hooks/useForeignApolloClient";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/crud/wrapGql";
import ContentExcerpt, { CommonExcerptProps } from "./ContentExcerpt";
import Loading from "../../vulcan-core/Loading";

const HighlightWithHashQuery = gql(`
  query PostExcerpt($documentId: String, $hash: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...HighlightWithHash
      }
    }
  }
`);

const isSunshine = (post: PostsList | SunshinePostsList): post is SunshinePostsList =>
  "user" in post;

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
  const { loading: loadingHighlight, data } = useQuery(HighlightWithHashQuery, {
    variables: { documentId: post?.fmCrosspost?.foreignPostId ?? post?._id, hash },
    skip: !hash && !!post.contents,
    fetchPolicy: "cache-first",
    client: isForeign ? foreignApolloClient : undefined,
  });
  const postHighlight = data?.post?.result;

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

export default registerComponent(
  "PostExcerpt",
  PostExcerpt,
);


