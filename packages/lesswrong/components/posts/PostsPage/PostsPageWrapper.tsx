import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { useSingle, UseSingleProps } from '../../../lib/crud/withSingle';
import { isMissingDocumentError, isOperationNotAllowedError } from '../../../lib/utils/errorUtil';
import { isPostWithForeignId } from "./PostsPageCrosspostWrapper";

const PostsPageWrapper = ({ sequenceId, version, documentId }: {
  sequenceId: string|null,
  version?: string,
  documentId: string,
}) => {
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

  const { Error404, Loading, PostsPageCrosspostWrapper, PostsPage } = Components;
  if (error && !isMissingDocumentError(error) && !isOperationNotAllowedError(error)) {
    throw new Error(error.message);
  } else if (loading) {
    return <div><Loading/></div>
  } else if (error) {
    if (isMissingDocumentError(error)) {
      return <Error404/>
    } else if (isOperationNotAllowedError(error)) {
      return <Components.ErrorAccessDenied/>
    } else {
      throw new Error(error.message);
    }
  } else if (!post) {
    return <Error404/>
  } else if (isPostWithForeignId(post)) {
    return <PostsPageCrosspostWrapper post={post} refetch={refetch} fetchProps={fetchProps} />
  }

  return <PostsPage post={post} refetch={refetch} />
}

const PostsPageWrapperComponent = registerComponent("PostsPageWrapper", PostsPageWrapper);

declare global {
  interface ComponentTypes {
    PostsPageWrapper: typeof PostsPageWrapperComponent
  }
}
