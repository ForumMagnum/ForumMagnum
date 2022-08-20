import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { useSingle } from '../../../lib/crud/withSingle';
import { isMissingDocumentError, isOperationNotAllowedError } from '../../../lib/utils/errorUtil';

const PostsPageWrapper = ({ sequenceId, version, documentId }: {
  sequenceId: string|null,
  version?: string,
  documentId: string,
}) => {
  const { document: post, refetch, loading, error } = useSingle({
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
    
    documentId
  })

  const { Error404, Loading, PostsPage } = Components;
  if (error && !isMissingDocumentError(error) && !isOperationNotAllowedError(error)) {
    throw new Error(error.message);
  } else if (loading) {
    return <div><Loading/></div>
  } else if (!post) {
    return <Error404/>
  }
  
  return <PostsPage post={post} refetch={refetch} />
}

const PostsPageWrapperComponent = registerComponent("PostsPageWrapper", PostsPageWrapper);

declare global {
  interface ComponentTypes {
    PostsPageWrapper: typeof PostsPageWrapperComponent
  }
}
