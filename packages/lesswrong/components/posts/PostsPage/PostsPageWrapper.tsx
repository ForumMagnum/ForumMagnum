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

const PostsPageWrapper = ({ sequenceId, version, documentId }: {
  sequenceId: string|null,
  version?: string,
  documentId: string,
}) => {
  const currentUser = useCurrentUser();
  const { query } = useSubscribedLocation();

  const extraVariables = {sequenceId: 'String', ...(version && {version: 'String'}) }
  // Note: including batchKey ensures that the post query is not batched together with the
  // comments query when sent from the client (i.e. not during SSR). This makes the main post body load
  // much faster
  const extraVariablesValues = {sequenceId, batchKey: "singlePost", ...(version && {version}) }
  const fragmentName = version ? 'PostsWithNavigationAndRevision' : 'PostsWithNavigation'

  const fetchProps: UseSingleProps<"PostsWithNavigation"|"PostsWithNavigationAndRevision"> = {
    collectionName: "Posts",
    fragmentName,
    extraVariables,
    extraVariablesValues,
    documentId,
  };

  const { document: post, refetch, loading, error } = useSingle<"PostsWithNavigation"|"PostsWithNavigationAndRevision">(fetchProps);

  // This section is a performance optimisation to make comment fetching start as soon as possible rather than waiting for
  // the post to be fetched first. This is mainly beneficial in SSR

  // Note: in principle defaultView can depend on the post (via post.commentSortOrder). In practice this is almost never set,
  // less than 1/1000 posts have it set. If it is set the consequences are that the comments will be fetched twice. This shouldn't
  // cause any rerendering or significant performance cost (relative to only fetching them once) because the second fetch doesn't wait
  // for the first to finish.
  const defaultView = commentGetDefaultView(null, currentUser)
  // If the provided view is among the valid ones, spread whole query into terms, otherwise just do the default query
  const terms: CommentsViewTerms = Object.keys(viewNames).includes(query.view)
    ? {...(query as CommentsViewTerms), limit:1000}
    : {view: defaultView, limit: 1000, postId: documentId}
  
  // If this has a commentId in the URL, don't SSR comments. This is so that misbehaving crawlers
  // that ignore the robots.txt request not to load /posts/idasdfid/slug?commentId=idasdfid for
  // every possible commend ID, are loading a cheap version of the page instead of loading a
  // potentially large number of comments each time.
  const hasCommentId = !!query.commentId;

  const commentQueryResult = useMulti({
    terms,
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
    ssr: !hasCommentId,
  });
  const eagerPostComments = {
    terms,
    queryResponse: commentQueryResult,
  }
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
    return <PostsPageCrosspostWrapper post={post} eagerPostComments={eagerPostComments} refetch={refetch} fetchProps={fetchProps} />
  }

  return (
    <PostsPage
      post={post}
      eagerPostComments={eagerPostComments}
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
