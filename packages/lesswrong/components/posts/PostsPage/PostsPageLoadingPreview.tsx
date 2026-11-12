'use client';
import React, { Suspense } from 'react';
import { useSubscribedLocation } from '@/lib/routeUtil';
import { isServer } from '@/lib/executionEnvironment';
import Loading from '../../vulcan-core/Loading';
import PostsPage from './PostsPage';
import { usePostPreload } from './usePostPreload';

// Only used by questions' answer sections, which aren't rendered in preview mode
const noRefetch = () => {};

/**
 * Loading state for post pages. NextJS shows this immediately when you
 * navigate to a post, while it waits for the route's RSC payload. If the post
 * is in the apollo cache (eg because you clicked on it in a posts list), show
 * the start of the post instead of a spinner. The real PostsPage, which shows
 * the same thing until the full post loads, replaces this once the route has
 * loaded.
 */
const PostsPageLoadingPreview = () => {
  const { params } = useSubscribedLocation();
  const postPreload = usePostPreload(params._id, null);

  // During SSR the post isn't in the cache, and this loading state is never
  // hydrated, so don't try.
  if (isServer || !postPreload) {
    return <Loading/>;
  }

  return <Suspense fallback={<Loading/>}>
    <PostsPage
      fullPost={undefined}
      postPreload={postPreload}
      sequenceIdFromUrl={null}
      refetch={noRefetch}
      preview
    />
  </Suspense>
}

export default PostsPageLoadingPreview;
