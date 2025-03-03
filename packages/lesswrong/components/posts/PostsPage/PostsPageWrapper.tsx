import React from 'react';
import { isMissingDocumentError, isOperationNotAllowedError } from '../../../lib/utils/errorUtil';
import { isPostWithForeignId } from "./PostsPageCrosspostWrapper";
import { commentGetDefaultView } from '../../../lib/collections/comments/helpers';
import { useCurrentUser } from '../../common/withUser';
import { useMulti } from '../../../lib/crud/withMulti';
import { useSubscribedLocation } from '../../../lib/routeUtil';
import { isValidCommentView } from '../../../lib/commentViewOptions';
import { postsCommentsThreadMultiOptions } from './PostsPage';
import { useDisplayedPost } from '../usePost';
import { useSingle } from '../../../lib/crud/withSingle';
import { useApolloClient } from '@apollo/client';
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { getFragment } from '@/lib/vulcan-lib/fragments';


const PostsPageWrapper = ({ sequenceId, version, documentId }: {
  sequenceId: string|null,
  version?: string,
  documentId: string,
}) => {
  const currentUser = useCurrentUser();
  const { query } = useSubscribedLocation();

  const apolloClient = useApolloClient();
  const postPreload = apolloClient.cache.readFragment<PostsListWithVotes>({
    fragment: getFragment("PostsListWithVotes"),
    fragmentName: "PostsListWithVotes",
    id: 'Post:'+documentId,
  });

  const sequencePreload = apolloClient.cache.readFragment<SequencesPageFragment>({
    fragment: getFragment("SequencesPageFragment"),
    fragmentName: "SequencesPageFragment",
    id: 'Sequence:'+sequenceId,
  });

  const postPreloadWithSequence = (sequencePreload && postPreload) ? {
    ...postPreload,
    sequence: sequencePreload,
  } : postPreload;

  const { document: post, refetch, loading, error, fetchProps } = useDisplayedPost(documentId, sequenceId, version);

  // This section is a performance optimisation to make comment fetching start as soon as possible rather than waiting for
  // the post to be fetched first. This is mainly beneficial in SSR

  // Note: in principle defaultView can depend on the post (via post.commentSortOrder). In practice this is almost never set,
  // less than 1/1000 posts have it set. If it is set the consequences are that the comments will be fetched twice. This shouldn't
  // cause any rerendering or significant performance cost (relative to only fetching them once) because the second fetch doesn't wait
  // for the first to finish.
  const defaultView = commentGetDefaultView(null, currentUser)
  // If the provided view is among the valid ones, spread whole query into terms, otherwise just do the default query
  const commentOpts = {includeAdminViews: currentUser?.isAdmin};
  const terms: CommentsViewTerms = isValidCommentView(query.view, commentOpts)
    ? {...(query as CommentsViewTerms), limit:1000}
    : {view: defaultView, limit: 1000, postId: documentId}

  const commentQueryResult = useMulti({
    terms,
    ...postsCommentsThreadMultiOptions,
  });
  const eagerPostComments = {
    terms,
    queryResponse: commentQueryResult,
  }
  // End of performance section

  const { Error404, Loading, PostsPageCrosspostWrapper, PostsPage } = Components;
  if (error && !isMissingDocumentError(error) && !isOperationNotAllowedError(error)) {
    throw new Error(error.message);
  } else if (loading && !postPreloadWithSequence) {
    return <div><Loading/></div>
  } else if (error) {
    if (isMissingDocumentError(error)) {
      return <Error404/>
    } else if (isOperationNotAllowedError(error)) {
      return <Components.ErrorAccessDenied explanation={"This is usually because the post in question has been removed by the author."} skipLoginPrompt />
    } else {
      throw new Error(error.message);
    }
  } else if (!post && !postPreloadWithSequence) {
    return <Error404/>
  } else if (post && isPostWithForeignId(post)) {
    return <PostsPageCrosspostWrapper post={post} eagerPostComments={eagerPostComments} refetch={refetch} fetchProps={fetchProps} />
  }

  return (
    <PostsPage
      fullPost={post}
      postPreload={postPreloadWithSequence ?? undefined}
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
