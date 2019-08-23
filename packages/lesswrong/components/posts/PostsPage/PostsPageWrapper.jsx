import React from 'react';
import { Components, registerComponent, useSingle } from 'meteor/vulcan:core';
import { Posts } from '../../../lib/collections/posts';

const PostsPageWrapper = ({ sequenceId, version, documentId }) => {
  const { document: post, refetch, loading, error } = useSingle({
    collection: Posts,
    queryName: 'postsSingleQuery',
    enableTotal: false,
    ssr: true,
    
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

registerComponent("PostsPageWrapper", PostsPageWrapper);
