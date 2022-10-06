import React, { createContext, useContext } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useSingle, UseSingleProps } from "../../../lib/crud/withSingle";
import { isMissingDocumentError, isOperationNotAllowedError } from "../../../lib/utils/errorUtil";
import { useCrosspostApolloClient } from "../../hooks/useCrosspostApolloClient";

type PostType = PostsWithNavigation | PostsWithNavigationAndRevision;

export type CrosspostContext = {
  hostedHere: boolean,
  localPost: PostType,
  foreignPost?: PostType,
  combinedPost?: PostType,
}

const crosspostContext = createContext<CrosspostContext | null>(null);

export const useCrosspostContext = () => useContext(crosspostContext);

export type PostWithForeignId = PostType & {
  fmCrosspost: {
    isCrosspost: true,
    hostedHere: boolean,
    foreignPostId: string,
  },
};

export const isPostWithForeignId = (post: PostType): post is PostWithForeignId =>
  !!post.fmCrosspost &&
  !!post.fmCrosspost.isCrosspost &&
  typeof post.fmCrosspost.hostedHere === "boolean" &&
  !!post.fmCrosspost.foreignPostId;

const PostsPageCrosspostWrapper = ({post, refetch, fetchProps}: {
  post: PostWithForeignId,
  refetch: () => Promise<void>,
  fetchProps: UseSingleProps<"PostsWithNavigation"|"PostsWithNavigationAndRevision">,
}) => {
  const apolloClient = useCrosspostApolloClient();
  const { document, loading, error } = useSingle<"PostsWithNavigation"|"PostsWithNavigationAndRevision">({
    ...fetchProps,
    documentId: post.fmCrosspost.foreignPostId,
    apolloClient,
  });

  const { Error404, Loading, PostsPage } = Components;
  if (error && !isMissingDocumentError(error) && !isOperationNotAllowedError(error)) {
    throw new Error(error.message);
  } else if (loading) {
    return <div><Loading/></div>
  } else if (!document && !post.draft) {
    return <Error404/>
  }

  const contextValue: CrosspostContext = {
    hostedHere: !!post.fmCrosspost.hostedHere,
    localPost: post,
    foreignPost: document,
  };

  if (!contextValue.hostedHere) {
    /**
     * If this post was crossposted from elsewhere then we want to take most of the fields from
     * our local copy (for correct links/ids/etc.) but we need to override a few specific fields
     * to actually get the correct content and some metadata that isn't denormalized across sites
     */
    const overrideFields = ["contents", "tableOfContents", "url", "readTimeMinutes"];
    contextValue.combinedPost = {...document, ...post};
    for (const field of overrideFields) {
      contextValue.combinedPost[field] = document?.[field] ?? post[field];
    }
  }

  return (
    <crosspostContext.Provider value={contextValue}>
      <PostsPage post={contextValue.combinedPost ?? post} refetch={refetch} />
    </crosspostContext.Provider>
  );
}

const PostsPageCrosspostWrapperComponent = registerComponent("PostsPageCrosspostWrapper", PostsPageCrosspostWrapper);

declare global {
  interface ComponentTypes {
    PostsPageCrosspostWrapper: typeof PostsPageCrosspostWrapperComponent
  }
}
