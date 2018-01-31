import { Components, registerComponent, withDocument} from 'meteor/vulcan:core';
import { Posts } from 'meteor/example-forum';
import React from 'react';
import { Error404 } from 'meteor/vulcan:core';

const PostsBody = (props) => {
  if (props.document) {
    return <div className="post-body" dangerouslySetInnerHTML={{__html: props.document.htmlBody}}/>
  } else {
    return props.loading ? <Components.Loading/> : <Error404 />
  }
};

PostsBody.displayName = "PostsBody";

const options = {
  collection: Posts,
  queryName: 'LWPostsBodyQuery',
  fragmentName: 'LWPostsBody',
};

registerComponent('PostsBody', PostsBody, [withDocument, options]);
