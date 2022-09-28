import { useCrosspostApolloClient } from "./useCrosspostApolloClient";
import { useSingle, UseSingleProps } from "../../lib/crud/withSingle";

export type ForeignCrosspost = {
  fmCrosspost: {
    isCrosspost: true,
    hostedHere: false,
    foreignPostId: string,
  }
}

export const isForeignCrosspost =
  <T extends {fmCrosspost: PostsList["fmCrosspost"]}>(post: T): post is T & ForeignCrosspost => {
    return !!post.fmCrosspost &&
      post.fmCrosspost.isCrosspost &&
      !post.fmCrosspost.hostedHere &&
      !!post.fmCrosspost.foreignPostId;
  }

export const useForeignCrosspost = <Post extends ForeignCrosspost, FragmentTypeName extends keyof FragmentTypes>(
  post: Post,
  fetchProps: Omit<UseSingleProps<FragmentTypeName>, "documentId" | "apolloClient">,
) => {
  if (!post.fmCrosspost.foreignPostId) {
    throw new Error("Crosspost has not been created yet");
  }

  const apolloClient = useCrosspostApolloClient();
  const { document, loading, error } = useSingle<FragmentTypeName>({
    ...fetchProps,
    documentId: post.fmCrosspost.foreignPostId,
    apolloClient,
  });

  let combinedPost: Post | null = null;
  if (!post.fmCrosspost.hostedHere) {
    /**
     * If this post was crossposted from elsewhere then we want to take most of the fields from
     * our local copy (for correct links/ids/etc.) but we need to override a few specific fields
     * to actually get the correct content and some metadata that isn't denormalized across sites
     */
    const overrideFields = ["contents", "readTimeMinutes"];
    combinedPost = {...document, ...post};
    for (const field of overrideFields) {
      combinedPost[field] = document?.[field] ?? post[field];
    }
  }

  return {
    loading,
    error,
    localPost: post,
    foreignPost: document,
    combinedPost,
  };
}
