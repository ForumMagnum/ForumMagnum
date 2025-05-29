import React from 'react';
import { isMissingDocumentError, isOperationNotAllowedError } from '../../../lib/utils/errorUtil';
import PostsPageCrosspostWrapper, { isPostWithForeignId } from "./PostsPageCrosspostWrapper";
import { commentGetDefaultView } from '../../../lib/collections/comments/helpers';
import { useCurrentUser } from '../../common/withUser';
import { useMulti } from '../../../lib/crud/withMulti';
import { useSubscribedLocation } from '../../../lib/routeUtil';
import { isValidCommentView } from '../../../lib/commentViewOptions';
import PostsPage, { postsCommentsThreadMultiOptions } from './PostsPage';
import { useDisplayedPost } from '../usePost';
import { useApolloClient } from '@apollo/client';
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { getFragment } from '@/lib/vulcan-lib/fragments';
import ErrorAccessDenied from "../../common/ErrorAccessDenied";
import Error404 from "../../common/Error404";
import Loading from "../../vulcan-core/Loading";

const PostsPageWrapper = ({ sequenceId, version, documentId }: {
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
    return <PostsPageCrosspostWrapper post={post} refetch={refetch} fetchProps={fetchProps} />
  }

  return (
    <PostsPage
      fullPost={post}
      postPreload={postPreloadWithSequence ?? undefined}
      refetch={refetch}
    />
  );
}

export default registerComponent("PostsPageWrapper", PostsPageWrapper);


