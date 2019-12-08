import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { useLocation } from '../../lib/routeUtil.js';
import { usePostByLegacyId } from '../posts//usePost.js';
import { useCommentByLegacyId } from './useComment.js';
import { Comments } from '../../lib/collections/comments/collection.js';
import { Posts } from '../../lib/collections/posts/collection.js';


const LegacyCommentRedirect = () => {
  const { params } = useLocation();
  const legacyPostId = params.id;
  const legacyCommentId = params.commentId;
  const { post, loading: loadingPost } = usePostByLegacyId({ legacyId: legacyPostId });
  const { comment, loading: loadingComment } = useCommentByLegacyId({ legacyId: legacyCommentId });
  
  if (post && comment) {
    const canonicalUrl = Comments.getPageUrlFromIds({
      postId: post._id, postSlug: post.slug,
      commentId: comment._id, permalink: true
    });
    return <Components.PermanentRedirect url={canonicalUrl}/>
  } else if (post) {
    const canonicalUrl = Posts.getPageUrl(post);
    return <Components.PermanentRedirect url={canonicalUrl}/>
  } else {
    return (loadingPost || loadingComment) ? <Components.Loading/> : <Components.Error404/>;
  }
};

registerComponent('LegacyCommentRedirect', LegacyCommentRedirect);
