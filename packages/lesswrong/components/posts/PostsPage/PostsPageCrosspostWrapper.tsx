import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useSingle, UseSingleProps } from "../../../lib/crud/withSingle";
import { isMissingDocumentError, isOperationNotAllowedError } from "../../../lib/utils/errorUtil";
import { useCrosspostApolloClient } from "./withCrosspostApolloClient";

const PostsPageCrosspostWrapper = ({post, refetch, fetchProps}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  refetch: () => Promise<void>,
  fetchProps: UseSingleProps<"PostsWithNavigation"|"PostsWithNavigationAndRevision">,
}) => {
  const apolloClient = useCrosspostApolloClient();
  const { document, loading, error } = useSingle<"PostsWithNavigation"|"PostsWithNavigationAndRevision">({
    ...fetchProps,
    documentId: post.fmCrosspost.foreignPostId,
    apolloClient,
  });

  const { Error404, Loading, PostsPageCrosspostWrapper, PostsPage } = Components;
  if (error && !isMissingDocumentError(error) && !isOperationNotAllowedError(error)) {
    throw new Error(error.message);
  } else if (loading) {
    return <div><Loading/></div>
  } else if (!document) {
    return <Error404/>
  }

  const result = {
    ...document,
    ...post,
    contents: document.contents,
  };

  return <PostsPage post={result} refetch={refetch} />
}

const PostsPageCrosspostWrapperComponent = registerComponent("PostsPageCrosspostWrapper", PostsPageCrosspostWrapper);

declare global {
  interface ComponentTypes {
    PostsPageCrosspostWrapper: typeof PostsPageCrosspostWrapperComponent
  }
}
