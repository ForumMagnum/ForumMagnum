import React from 'react';
import { Components, registerComponent, withDocument } from 'meteor/vulcan:core';
import { Comments } from '../../lib/collections/comments';

// Wraps PostsPage with a withDocument, taking a documentId instead of a post
// object.
const CommentPermalink = (props) => {
  const {document: comment, sequenceId, version, data: {refetch}, loading, error} = props
  const { Error404, Loading, CommentsNode } = Components;
  if (error) {
    return <Error404 />
  } else if (loading) {
    return <div><Loading/></div>
  } else if (!comment) {
    return <Error404/>
  }
  console.log(props)
  return <CommentsNode comment={comment}/>
}

registerComponent("CommentPermalink", CommentPermalink,
  [withDocument, {
    collection: Comments,
    queryName: 'commentsPermalinkQuery',
    fragmentName: 'commentWithContextFragment',
    enableTotal: false,
    enableCache: true,
    ssr: true,
    extraVariables: {
      version: 'String',
      sequenceId: 'String',
    }
  }]
);
