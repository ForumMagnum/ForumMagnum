import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil';
import { usePostByLegacyId } from '../posts/usePost';
import { useCommentByLegacyId } from './useComment';
import { commentGetPageUrlFromIds } from '../../lib/collections/comments/helpers';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';


const LegacyCommentRedirectInner = () => {
  const { params } = useLocation();
  const legacyPostId = params.id;
  const legacyCommentId = params.commentId;
  const { post, loading: loadingPost } = usePostByLegacyId({ legacyId: legacyPostId });
  const { comment, loading: loadingComment } = useCommentByLegacyId({ legacyId: legacyCommentId });
  
  if (post && comment) {
    const canonicalUrl = commentGetPageUrlFromIds({
      postId: post._id, postSlug: post.slug,
      commentId: comment._id, permalink: true
    });
    return <Components.PermanentRedirect url={canonicalUrl}/>
  } else if (post) {
    const canonicalUrl = postGetPageUrl(post);
    return <Components.PermanentRedirect url={canonicalUrl}/>
  } else {
    return (loadingPost || loadingComment) ? <Components.Loading/> : <Components.Error404/>;
  }
};

export const LegacyCommentRedirect = registerComponent('LegacyCommentRedirect', LegacyCommentRedirectInner);

declare global {
  interface ComponentTypes {
    LegacyCommentRedirect: typeof LegacyCommentRedirect,
  }
}

