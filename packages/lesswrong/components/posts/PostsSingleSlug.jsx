import { Components, registerComponent, withList} from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import React from 'react';
import { Error404 } from 'meteor/vulcan:core';

const PostsSingleSlug = (props) => {
  if (props.results && props.results.length>0 && props.results[0]._id) {
    return <Components.PostsPage documentId={props.results[0]._id } />
  } else {
    return props.loading ? <Components.Loading/> : <Error404 />
  }
};

PostsSingleSlug.displayName = "PostsSingleSlug";

const options = {
  collection: Posts,
  queryName: 'LWPostsPageSlugQuery',
  fragmentName: 'LWPostsPage',
  limit: 1,
  enableTotal: false,
  ssr: true,
};

registerComponent('PostsSingleSlug', PostsSingleSlug, [withList, options]);
