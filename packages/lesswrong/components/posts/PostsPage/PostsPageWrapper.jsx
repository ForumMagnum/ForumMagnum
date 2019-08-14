import React from 'react';
import { Components, registerComponent, useSingle } from 'meteor/vulcan:core';
import { Posts } from '../../../lib/collections/posts';

const PostsPageWrapper = ({ sequenceId, version, documentId }) => {
  const { document: post, refetch, loading, error } = useSingle({
    collection: Posts,
    queryName: 'postsSingleQuery',
    fragmentName: (version || sequenceId) ? 'PostsWithNavigation' : 'PostsPage',
    enableTotal: false,
    enableCache: true,
    ssr: true,
    extraVariables: (version || sequenceId) ? {
      version: 'String',
      sequenceId: 'String',
    } : undefined,
    extraVariablesValues: (version || sequenceId) ? { version, sequenceId } : {},
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
