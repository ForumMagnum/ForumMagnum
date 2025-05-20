import { ApolloError, gql, useQuery } from "@apollo/client";
import { postGetCommentCountStr } from "../../lib/collections/posts/helpers";
import { UseSingleProps } from "../../lib/crud/withSingle";

export type PostWithForeignId = {
  fmCrosspost: {
    isCrosspost: true,
    hostedHere: boolean,
    foreignPostId: string,
  },
};

export const isPostWithForeignId =
  <T extends {fmCrosspost?: PostsList["fmCrosspost"]}>(post: T): post is T & PostWithForeignId =>
    !!post.fmCrosspost &&
    !!post.fmCrosspost.isCrosspost &&
    typeof post.fmCrosspost.hostedHere === "boolean" &&
    !!post.fmCrosspost.foreignPostId;

const hasTableOfContents =
  <
    Post extends PostWithForeignId,
    WithContents extends Post & {tableOfContents: {sections: any[]}}
  >(post: Post): post is WithContents =>
    "tableOfContents" in post && Array.isArray((post as WithContents).tableOfContents?.sections);

/**
 * If this post was crossposted from elsewhere then we want to take some of the fields from
 * our local copy (for correct links/ids/etc.), but we want to override many of the fields
 * with foreign data, to keep the origin post as the source of truth, and get some metadata
 * that isn't denormalized across sites.
 */
const overrideFields = [
  "contents",
  "tableOfContents",
  "url",
  "readTimeMinutes",
] as const;

const getCrosspostQuery = gql(`
  query GetCrosspostQuery($args: JSON) {
    getCrosspost(args: $args)
  }
`);

/**
 * These queries can be slow (and the timing is unpredictable), so use
 * `batchKey: "crosspost"` to make sure it doesn't get batched together with
 * other queries and block them
 */
const crosspostBatchKey = "crosspost";

export type PostFetchProps<FragmentTypeName extends CrosspostFragments> =
  Omit<UseSingleProps<FragmentTypeName>, "documentId" | "apolloClient">;

/**
 * This lists the valid fragment names that can be passed to the foreign site
 * when fetching a post with a cross-site request. Note that the fragment name
 * passed to the foreign site _is_ validated against this list and will throw
 * an error if the fragment name isn't here, so additions to this list need to
 * be deployed to _both_ sites before deploying any logic that relies on them
 * otherwise your cross-site requests with be rejected.
 */
export const crosspostFragments = [
  "PostsWithNavigation",
  "PostsWithNavigationAndRevision",
  "PostsList",
  "SunshinePostsList",
  "PostsPage",
] as const;

type CrosspostFragments = typeof crosspostFragments[number];

/**
 * Load foreign crosspost data from the foreign site
 */
export function useForeignCrosspost<Post extends FragmentTypes[CrosspostFragments], FragmentTypeName extends CrosspostFragments>(
  localPost: Post,
  fetchProps: PostFetchProps<FragmentTypeName>,
): {
  loading: boolean,
  error?: ApolloError,
  localPost: Post,
  foreignPost?: FragmentTypes[FragmentTypeName],
  combinedPost?: Post & FragmentTypes[FragmentTypeName] & PostWithForeignId,
} {
  const skip = !isPostWithForeignId(localPost);
  // From the user's perspective crossposts are created atomically (ie; failing to create a crosspost
  // will also fail to create a local post), so this should never create a race condition - if we hit
  // this then something's actually gone seriously wrong
  if (!localPost.fmCrosspost?.foreignPostId && !skip) {
    throw new Error("Crosspost has not been created yet");
  }

  const {data, loading, error} = useQuery(getCrosspostQuery, {
    variables: {
      args: {
        ...fetchProps,
        documentId: localPost.fmCrosspost?.foreignPostId,
      },
      batchKey: crosspostBatchKey,
    },
    skip
  });

  const foreignPost: FragmentTypes[FragmentTypeName] = data?.getCrosspost;

  let combinedPost: (Post & FragmentTypes[FragmentTypeName] & PostWithForeignId) | undefined;
  if (isPostWithForeignId(localPost) && !localPost.fmCrosspost?.hostedHere) {
    combinedPost = {...foreignPost, ...localPost};
    for (const field of overrideFields) {
      Object.assign(combinedPost, { [field]: (foreignPost as AnyBecauseTodo)?.[field] ?? (localPost as AnyBecauseTodo)[field] });
    }
    // We just took the table of contents from the foreign version, but we want to use the local comment count
    if (hasTableOfContents(combinedPost)) {
      combinedPost.tableOfContents = {
        ...combinedPost.tableOfContents,
        sections: combinedPost.tableOfContents.sections.map((section: {anchor?: string}) =>
          section.anchor === "comments"
            ? {...section, title: postGetCommentCountStr(localPost as unknown as PostsBase)}
            : section
        ),
      };
    }
  }

  return {
    loading: loading && !skip,
    error,
    localPost,
    foreignPost,
    combinedPost,
  };
}

/**
 * Returns the post contents for any post, abstracting over whether or not the
 * post is a crosspost. If the post is a crosspost then a request will be made
 * to fetch the body from the foreign site, and it it's not a crosspost then
 * the body will be returned directly from the input post.
 */
export const usePostContents = <FragmentTypeName extends CrosspostFragments>({
  post,
  fragmentName,
  fetchProps,
  skip,
}: {
  post: FragmentTypes[FragmentTypeName],
  fragmentName: FragmentTypeName,
  fetchProps?: PostFetchProps<FragmentTypeName>,
  skip?: boolean,
}): {
  postContents?: FragmentTypes[FragmentTypeName]["contents"],
  loading: boolean,
  error?: ApolloError,
} => {
  const isCrosspost = isPostWithForeignId(post);
  const isForeign = isCrosspost && !post.fmCrosspost.hostedHere;

  const {data, loading, error} = useQuery(getCrosspostQuery, {
    variables: {
      args: {
        ...fetchProps,
        collectionName: "Posts",
        fragmentName,
        documentId: post.fmCrosspost?.foreignPostId,
      },
      batchKey: crosspostBatchKey,
    },
    skip: !isForeign || skip,
  });

  if (isForeign) {
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching crosspost body:", error);
    }

    const foreignPost: FragmentTypes[FragmentTypeName] | undefined = data?.getCrosspost;
    return {
      postContents: foreignPost?.contents,
      loading,
      error,
    };
  }

  return {
    postContents: post.contents,
    loading: false,
    error: undefined,
  };
}
