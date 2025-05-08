import React from 'react';
import { isMissingDocumentError, isOperationNotAllowedError } from '../../../lib/utils/errorUtil';
import { isPostWithForeignId, PostsPageCrosspostWrapper } from "./PostsPageCrosspostWrapper";
import { commentGetDefaultView } from '../../../lib/collections/comments/helpers';
import { useCurrentUser } from '../../common/withUser';
import { useMulti } from '../../../lib/crud/withMulti';
import { useSubscribedLocation } from '../../../lib/routeUtil';
import { isValidCommentView } from '../../../lib/commentViewOptions';
import { postsCommentsThreadMultiOptions, PostsPage } from './PostsPage';
import { useDisplayedPost } from '../usePost';
import { useApolloClient } from '@apollo/client';
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { getFragment } from '@/lib/vulcan-lib/fragments';
import { ErrorAccessDenied } from "../../common/ErrorAccessDenied";
import { Error404 } from "../../common/Error404";
import { Loading } from "../../vulcan-core/Loading";

const PostsPageWrapperInner = ({ sequenceId, version, documentId }: {
  sequenceId: string|null,
  version?: string,
  documentId: string,
}) => {
  const currentUser = useCurrentUser();
  const { query } = useSubscribedLocation();

  // Check the cache for a copy of the post with the PostsListWithVotes fragment, so that when you click through
  // a PostsItem, you can see the start of the post (the part of the text that was in the hover-preview) while
  // it loads the rest.
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
  // the post to be fetched first. This is mainly beneficial in SSR. We don't preload comments if the post was preloaded
  // (which happens on the client when navigating through a PostsItem), because the preloaded post already takes care of
  // the waterfalling queries and the preload would be a duplicate query.

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

  // Don't pass in the eagerPostComments if we skipped the query,
  // otherwise PostsPage will skip the lazy query if the terms change
  const skipEagerComments = !!postPreload;
  const commentQueryResult = useMulti({
    terms,
    skip: skipEagerComments,
    ...postsCommentsThreadMultiOptions,
  });
  const eagerPostComments = skipEagerComments
    ? undefined
    : { terms, queryResponse: commentQueryResult };
    
  // End of performance section
  if (error && !isMissingDocumentError(error) && !isOperationNotAllowedError(error)) {
    throw new Error(error.message);
  } else if (loading && !postPreloadWithSequence) {
    return <div><Loading/></div>
  } else if (error) {
    if (isMissingDocumentError(error)) {
      return <Error404/>
    } else if (isOperationNotAllowedError(error)) {
      return <ErrorAccessDenied explanation={"This is usually because the post in question has been removed by the author."} skipLoginPrompt />
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

export const PostsPageWrapper = registerComponent("PostsPageWrapper", PostsPageWrapperInner);

declare global {
  interface ComponentTypes {
    PostsPageWrapper: typeof PostsPageWrapper
  }
}
