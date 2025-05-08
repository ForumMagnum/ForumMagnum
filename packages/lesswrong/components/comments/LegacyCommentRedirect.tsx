import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil';
import { usePostByLegacyId } from '../posts/usePost';
import { useCommentByLegacyId } from './useComment';
import { commentGetPageUrlFromIds } from '../../lib/collections/comments/helpers';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { PermanentRedirect } from "../common/PermanentRedirect";
import { Loading } from "../vulcan-core/Loading";
import { Error404 } from "../common/Error404";

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
    return <PermanentRedirect url={canonicalUrl}/>
  } else if (post) {
    const canonicalUrl = postGetPageUrl(post);
    return <PermanentRedirect url={canonicalUrl}/>
  } else {
    return (loadingPost || loadingComment) ? <Loading/> : <Error404/>;
  }
};

export const LegacyCommentRedirect = registerComponent('LegacyCommentRedirect', LegacyCommentRedirectInner);

declare global {
  interface ComponentTypes {
    LegacyCommentRedirect: typeof LegacyCommentRedirect,
  }
}

