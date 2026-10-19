import React, { useCallback } from 'react';
import { isMissingDocumentError, isOperationNotAllowedError } from '../../../lib/utils/errorUtil';
import { useQuery } from "@/lib/crud/useQuery"
import { gql } from "@/lib/generated/gql-codegen";
import PostsPage from './PostsPage';
import ErrorAccessDenied from "../../common/ErrorAccessDenied";
import Error404 from "../../common/Error404";
import Loading from "../../vulcan-core/Loading";
import { StatusCodeSetter } from '@/components/next/StatusCodeSetter';
import { usePostPreload } from './usePostPreload';

const PostsWithNavigationAndRevisionQuery = gql(`
  query PostsPageWrapper1($documentId: String, $sequenceId: String, $version: String) {
    post(input: { selector: { documentId: $documentId } }, allowNull: true) {
      result {
        ...PostsWithNavigationAndRevision
      }
    }
  }
`);

const PostsWithNavigationQuery = gql(`
  query PostsPageWrapper($documentId: String, $sequenceId: String) {
    post(input: { selector: { documentId: $documentId } }, allowNull: true) {
      result {
        ...PostsWithNavigation
      }
    }
  }
`);

const PostsPageWrapper = ({ sequenceId, version, documentId, embedded }: {
  sequenceId: string|null,
  version?: string,
  documentId: string,
  embedded?: boolean,
}) => {
  const postPreloadWithSequence = usePostPreload(documentId, sequenceId);

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

  return <>
    <StatusCodeSetter status={200}/>
    <PostsPage
      fullPost={post}
      postPreload={postPreloadWithSequence ?? undefined}
      sequenceIdFromUrl={sequenceId}
      refetch={refetch}
      embedded={embedded}
    />
  </>;
}

export default PostsPageWrapper;
