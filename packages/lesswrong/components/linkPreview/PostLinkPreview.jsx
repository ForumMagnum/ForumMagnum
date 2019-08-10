import React from 'react';
import { Components, registerComponent, withDocument } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';

const PostLinkPreview = ({targetLocation}) => {
  const postID = targetLocation.params._id;
  return <Components.PostLinkPreviewWithPost documentId={postID} />
}
registerComponent('PostLinkPreview', PostLinkPreview);

const PostLinkPreviewWithPost = ({loading, document, error}) => {
  if (loading || !document) {
    return <Components.Loading/>
  }
  if (error) {
    return error.message;
  }
  
  return <Components.PostsItemTooltip
    post={document}
    showTitle={true}
    author={true}
  />
}
registerComponent('PostLinkPreviewWithPost', PostLinkPreviewWithPost,
  [withDocument, {
    collection: Posts,
    queryName: "postLinkPreview",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-then-network',
  }]
);