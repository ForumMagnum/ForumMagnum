import { Components, registerComponent, withList} from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import React from 'react';
import { Error404 } from 'meteor/vulcan:core';
import { withRouter } from '../../lib/reactRouterWrapper.js';

const PostsSingleSlug = ({results, loading, router}) => {
  const version = router.location && router.location.query && router.location.query.revision
  if (results && results.length>0 && results[0]._id) {
    return <Components.PostsPage documentId={results[0]._id } sequenceId={null} version={version} />
  } else {
    return loading ? <Components.Loading/> : <Error404 />
  }
};

PostsSingleSlug.displayName = "PostsSingleSlug";

const options = {
  collection: Posts,
  queryName: 'PostsPageSlugQuery',
  fragmentName: 'PostsPage',
  limit: 1,
  enableTotal: false,
  ssr: true,
};

registerComponent('PostsSingleSlug', PostsSingleSlug, [withList, options], withRouter);
