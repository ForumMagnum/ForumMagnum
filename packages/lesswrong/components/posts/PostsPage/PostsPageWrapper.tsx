import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { useSingle } from '../../../lib/crud/withSingle';
import { Posts } from '../../../lib/collections/posts';

const PostsPageWrapper = ({ sequenceId, version, documentId }) => {
  const { document: post, refetch, loading, error } = useSingle({
    collection: Posts,
    
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
  if (error) {
    return <Error404 />
  } else if (loading) {
    return <div><Loading/></div>
  } else if (!post) {
    return <Error404/>
  }
  
  return <PostsPage
    post={post}
    sequenceId={sequenceId}
    version={version}
    refetch={refetch}
  />
}

const PostsPageWrapperComponent = registerComponent("PostsPageWrapper", PostsPageWrapper);

declare global {
  interface ComponentTypes {
    PostsPageWrapper: typeof PostsPageWrapperComponent
  }
}
