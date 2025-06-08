import React from 'react';
import { isMissingDocumentError, isOperationNotAllowedError } from '../../../lib/utils/errorUtil';
import PostsPageCrosspostWrapper, { isPostWithForeignId } from "./PostsPageCrosspostWrapper";
import { commentGetDefaultView } from '../../../lib/collections/comments/helpers';
import { useCurrentUser } from '../../common/withUser';
import { useSubscribedLocation } from '../../../lib/routeUtil';
import { useApolloClient } from '@apollo/client';
import { useQuery } from "@/lib/crud/useQuery"
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { gql } from "@/lib/crud/wrapGql";
import PostsPage, { postCommentsThreadQuery, usePostCommentTerms } from './PostsPage';
import ErrorAccessDenied from "../../common/ErrorAccessDenied";
import Error404 from "../../common/Error404";
import Loading from "../../vulcan-core/Loading";
import { PostFetchProps } from '@/components/hooks/useForeignCrosspost';
import { PostsListWithVotes } from '@/lib/collections/posts/fragments';
import { SequencesPageFragment } from '@/lib/collections/sequences/fragments';
import { useQueryWithLoadMore } from '@/components/hooks/useQueryWithLoadMore';

const PostsWithNavigationAndRevisionQuery = gql(`
  query PostsPageWrapper1($documentId: String, $sequenceId: String, $version: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsWithNavigationAndRevision
      }
    }
  }
`);

const PostsWithNavigationQuery = gql(`
  query PostsPageWrapper($documentId: String, $sequenceId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsWithNavigation
      }
    }
  }
`);

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
    fragment: PostsListWithVotes,
    fragmentName: "PostsListWithVotes",
    id: 'Post:'+documentId,
  });

  const sequencePreload = apolloClient.cache.readFragment<SequencesPageFragment>({
    fragment: SequencesPageFragment,
    fragmentName: "SequencesPageFragment",
    id: 'Sequence:'+sequenceId,
  });

  const postPreloadWithSequence = (sequencePreload && postPreload) ? {
    ...postPreload,
    sequence: sequencePreload,
  } : postPreload;

  const { loading: postWithoutRevisionLoading, error: postWithoutRevisionError, refetch: refetchPostWithoutRevision, data: postWithoutRevisionData } = useQuery(PostsWithNavigationQuery, {
    variables: { documentId: documentId, sequenceId },
    skip: !!version,
    context: { batchKey: "singlePost" },
  });
  const postWithoutRevision = postWithoutRevisionData?.post?.result ?? undefined;

  const { loading: postWithRevisionLoading, error: postWithRevisionError, refetch: refetchPostWithRevision, data: postWithRevisionData } = useQuery(PostsWithNavigationAndRevisionQuery, {
    variables: { documentId: documentId, sequenceId, version },
    skip: !version,
    context: { batchKey: "singlePost" },
  });
  const postWithRevision = postWithRevisionData?.post?.result ?? undefined;

  const post = version ? postWithRevision : postWithoutRevision;
  const loading = version ? postWithRevisionLoading : postWithoutRevisionLoading;
  const error = version ? postWithRevisionError : postWithoutRevisionError;
  const refetch = version ? refetchPostWithRevision : refetchPostWithoutRevision;

  const crosspostFetchProps: PostFetchProps<'PostsWithNavigation' | 'PostsWithNavigationAndRevision'> = {
    collectionName: 'Posts',
    fragmentName: version ? 'PostsWithNavigationAndRevision' : 'PostsWithNavigation',
    extraVariables: { sequenceId: 'String', ...(version ? { version: 'String' } : {}) },
    extraVariablesValues: { sequenceId, ...(version ? { version } : {}) },
  };

  // This section is a performance optimisation to make comment fetching start as soon as possible rather than waiting for
  // the post to be fetched first. This is mainly beneficial in SSR. We don't preload comments if the post was preloaded
  // (which happens on the client when navigating through a PostsItem), because the preloaded post already takes care of
  // the waterfalling queries and the preload would be a duplicate query.

  // Note: in principle defaultView can depend on the post (via post.commentSortOrder). In practice this is almost never set,
  // less than 1/1000 posts have it set. If it is set the consequences are that the comments will be fetched twice. This shouldn't
  // cause any rerendering or significant performance cost (relative to only fetching them once) because the second fetch doesn't wait
  // for the first to finish.
  const defaultView = commentGetDefaultView(null, currentUser);
  const defaultTerms = { view: defaultView, limit: 1000, postId: documentId };
  const { terms, view, limit } = usePostCommentTerms(currentUser, defaultTerms, query);

  // Don't pass in the eagerPostComments if we skipped the query,
  // otherwise PostsPage will skip the lazy query if the terms change
  const skipEagerComments = !!postPreload;

  const commentQueryResult = useQueryWithLoadMore(postCommentsThreadQuery, {
    variables: {
      selector: { [view]: terms },
      limit,
      enableTotal: true,
    },
    skip: skipEagerComments,
    fetchPolicy: 'cache-and-network' as const,
  });

  const eagerPostComments = skipEagerComments
    ? undefined
    : { terms: { ...terms, view }, queryResponse: commentQueryResult };
    
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
    return <PostsPageCrosspostWrapper post={post} eagerPostComments={eagerPostComments} refetch={refetch} fetchProps={crosspostFetchProps} />
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

export default registerComponent("PostsPageWrapper", PostsPageWrapper);


