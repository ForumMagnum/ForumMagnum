import React from 'react';
import { Components, registerComponent, withDocument } from 'meteor/vulcan:core';
import { Posts } from '../../../lib/collections/posts';

// Wraps PostsPage with a withDocument, taking a documentId instead of a post
// object.
const PostsPageWrapper = ({document: post, sequenceId, version, data: {refetch}, loading, error}) => {
  return <Components.PostsPage
    post={post}
    sequenceId={sequenceId}
    version={version}
    refetch={refetch}
    loading={loading}
    error={error}
  />
}

registerComponent("PostsPageWrapper", PostsPageWrapper,
  [withDocument, {
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
  }]
);
