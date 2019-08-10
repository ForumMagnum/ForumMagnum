import React from 'react';
import { Components, registerComponent, useSingle } from 'meteor/vulcan:core';
import { Posts } from '../../../lib/collections/posts';

// Wraps PostsPage with a withDocument, taking a documentId instead of a post
// object.
const PostsPageWrapper = ({ sequenceId, version, documentId }) => {
  const graphQLOptions = (version || sequenceId) ? graphQLOptionsWithNavigation : graphQLOptionsWithoutNavigation
  const graphQLVariables = (version || sequenceId) ? { version, sequenceId } : {}
  const { document: post, refetch, loading, error } = useSingle(graphQLOptions, documentId, graphQLVariables)
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

const graphQLOptionsWithNavigation = {
  collection: Posts,
  queryName: 'postsSingleQuery',
  fragmentName: 'PostsWithNavigation',
  enableTotal: false,
  enableCache: true,
  ssr: true,
  extraVariables: {
    version: 'String',
    sequenceId: 'String',
  }
}

const graphQLOptionsWithoutNavigation = {
  collection: Posts,
  queryName: 'postsSingleQuery',
  fragmentName: 'PostsPage',
  enableTotal: false,
  enableCache: true,
  ssr: true
}



registerComponent("PostsPageWrapper", PostsPageWrapper);
