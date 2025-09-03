import React, { useCallback } from 'react';
import { isMissingDocumentError, isOperationNotAllowedError } from '../../../lib/utils/errorUtil';
import { useApolloClient } from '@apollo/client/react';
import { useQuery } from "@/lib/crud/useQuery"
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { gql } from "@/lib/generated/gql-codegen";
import PostsPage from './PostsPage';
import ErrorAccessDenied from "../../common/ErrorAccessDenied";
import Error404 from "../../common/Error404";
import Loading from "../../vulcan-core/Loading";
import { PostsListWithVotes } from '@/lib/collections/posts/fragments';
import { SequencesPageFragment } from '@/lib/collections/sequences/fragments';

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
  const refetch = useCallback(async () => {
    if (version) await refetchPostWithRevision();
    else await refetchPostWithoutRevision();
  }, [refetchPostWithRevision, refetchPostWithoutRevision, version]);

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
