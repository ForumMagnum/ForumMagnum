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

const PostsPageCrosspostWrapper = ({post, refetch, fetchProps}: {
  post: PostType,
  refetch: () => Promise<void>,
  fetchProps: UseSingleProps<"PostsWithNavigation"|"PostsWithNavigationAndRevision">,
}) => {
  const apolloClient = useCrosspostApolloClient();
  const { document, loading, error } = useSingle<"PostsWithNavigation"|"PostsWithNavigationAndRevision">({
    ...fetchProps,
    documentId: post.fmCrosspost!.foreignPostId!,
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
    hostedHere: !!post.fmCrosspost!.hostedHere,
    localPost: post,
    foreignPost: document,
  };

  if (!contextValue.hostedHere) {
    contextValue.combinedPost = {
      ...document,
      ...post,
      contents: document?.contents ?? post.contents,
    };
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
