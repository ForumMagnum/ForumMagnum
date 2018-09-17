import { Components, withDocument} from 'meteor/vulcan:core';
import { Posts } from 'meteor/example-forum';
import React from 'react';
import { Error404 } from 'meteor/vulcan:core';
import defineComponent from '../../../lib/defineComponent';

const PostsBody = (props) => {
  if (props.document) {
    return <div className="post-body" dangerouslySetInnerHTML={{__html: props.document.htmlBody}}/>
  } else {
    return props.loading ? <Components.Loading/> : <Error404 />
  }
};

const options = {
  collection: Posts,
  queryName: 'LWPostsBodyQuery',
  fragmentName: 'LWPostsBody',
};

export default defineComponent({
  name: 'PostsBody',
  component: PostsBody,
  hocs: [ [withDocument, options] ]
});
