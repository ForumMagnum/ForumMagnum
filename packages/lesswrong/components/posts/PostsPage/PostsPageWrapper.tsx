import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { useSingle, UseSingleProps } from '../../../lib/crud/withSingle';
import { isMissingDocumentError, isOperationNotAllowedError } from '../../../lib/utils/errorUtil';
import { isPostWithForeignId } from "./PostsPageCrosspostWrapper";
import { commentGetDefaultView } from '../../../lib/collections/comments/helpers';
import { useCurrentUser } from '../../common/withUser';
import { useMulti } from '../../../lib/crud/withMulti';
import { viewNames } from '../../comments/CommentsViews';
import { useSubscribedLocation } from '../../../lib/routeUtil';
import { isServer } from '../../../lib/executionEnvironment';

const PostsPageWrapper = ({ sequenceId, version, documentId }: {
  sequenceId: string|null,
  version?: string,
  documentId: string,
}) => {
  const currentUser = useCurrentUser();
  const { query } = useSubscribedLocation();

  const fetchProps: UseSingleProps<"PostsWithNavigation"|"PostsWithNavigationAndRevision"> = {
    collectionName: "Posts",
    ...(version ? {
      fragmentName: 'PostsWithNavigationAndRevision',
      extraVariables: {
        version: 'String',
        sequenceId: 'String',
      },
      extraVariablesValues: { version, sequenceId },
    } : {
      fragmentName: 'PostsWithNavigation',
      extraVariables: {
        sequenceId: 'String',
      },
      extraVariablesValues: { sequenceId },
    }),
    documentId,
  };

  const { document: post, refetch, loading, error } = useSingle<"PostsWithNavigation"|"PostsWithNavigationAndRevision">(fetchProps);

  // This section is a performance optimisation to make comment fetching start as soon as possible rather than waiting for
  // the post to be fetched first. This is only beneficial in SSR (when the entire page is rendered before being returned), and not
  // if a post is reached by navigation. In the latter case, the post is fetched first is actually better as this is enough to fill
  // the page as far as the user can scroll. This is why we skip the query below if !isServer

  // Note: in principle defaultView can depend on the post (via post.commentSortOrder). In practice this is almost never set,
  // less than 1/1000 posts have it set. If it is set the consequences are that the comments will be sorted in the wrong order
  // at first and then quickly update. This is not ideal but it's worth the cost for the performance benefit.
  const defaultView = commentGetDefaultView(null, currentUser)
  // If the provided view is among the valid ones, spread whole query into terms, otherwise just do the default query
  const terms: CommentsViewTerms = Object.keys(viewNames).includes(query.view)
    ? {...(query as CommentsViewTerms), limit:1000}
    : {view: defaultView, limit: 1000, postId: documentId}

  const commentQueryResult = useMulti({
    terms,
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
  });
  // End of performance section

  const { Error404, Loading, PostsPageCrosspostWrapper, PostsPage } = Components;
  if (error && !isMissingDocumentError(error) && !isOperationNotAllowedError(error)) {
    throw new Error(error.message);
  } else if (loading) {
    return <div><Loading/></div>
  } else if (error) {
    if (isMissingDocumentError(error)) {
      return <Error404/>
    } else if (isOperationNotAllowedError(error)) {
      return <Components.ErrorAccessDenied explanation={"This is usually because the post in question has been removed by the author."}/>
    } else {
      throw new Error(error.message);
    }
  } else if (!post) {
    return <Error404/>
  } else if (isPostWithForeignId(post)) {
    return <PostsPageCrosspostWrapper post={post} refetch={refetch} fetchProps={fetchProps} />
  }

  return (
    <PostsPage
      post={post}
      eagerPostComments={{
        terms,
        queryResponse: commentQueryResult,
      }}
      refetch={refetch}
    />
  );
}

const PostsPageWrapperComponent = registerComponent("PostsPageWrapper", PostsPageWrapper);

declare global {
  interface ComponentTypes {
    PostsPageWrapper: typeof PostsPageWrapperComponent
  }
}
