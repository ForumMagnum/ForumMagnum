import React, { createContext, useContext } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { UseSingleProps } from "../../../lib/crud/withSingle";
import { isMissingDocumentError, isOperationNotAllowedError } from "../../../lib/utils/errorUtil";
import { useForeignCrosspost } from "../../hooks/useForeignCrosspost";
import type { EagerPostComments } from "./PostsPage";

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

const PostsPageCrosspostWrapper = ({post, eagerPostComments, refetch, fetchProps}: {
  post: PostWithForeignId,
  eagerPostComments?: EagerPostComments,
  refetch: () => Promise<void>,
  fetchProps: UseSingleProps<"PostsWithNavigation"|"PostsWithNavigationAndRevision">,
}) => {
  const {
    loading,
    error,
    localPost,
    foreignPost,
    combinedPost,
  } = useForeignCrosspost(post, fetchProps);

  const { Error404, Loading, PostsPage } = Components;
  // If we get a error fetching the foreign xpost data, that should not stop us
  // from rendering the post if we have it locally
  if (error && !post.fmCrosspost.hostedHere && !isMissingDocumentError(error) && !isOperationNotAllowedError(error)) {
    throw new Error(error.message);
  } else if (loading && !post.fmCrosspost.hostedHere) {
    return <div><Loading/></div>
  } else if (!post.fmCrosspost.hostedHere && !foreignPost && !post.draft) {
    return <Error404/>
  }

  const contextValue: CrosspostContext = {
    hostedHere: !!post.fmCrosspost.hostedHere,
    localPost,
    foreignPost,
    combinedPost,
  };

  return (
    <crosspostContext.Provider value={contextValue}>
      <PostsPage
        fullPost={contextValue.combinedPost ?? post}
        postPreload={undefined}
        eagerPostComments={eagerPostComments}
        refetch={refetch}
      />
    </crosspostContext.Provider>
  );
}

const PostsPageCrosspostWrapperComponent = registerComponent("PostsPageCrosspostWrapper", PostsPageCrosspostWrapper);

declare global {
  interface ComponentTypes {
    PostsPageCrosspostWrapper: typeof PostsPageCrosspostWrapperComponent
  }
}
