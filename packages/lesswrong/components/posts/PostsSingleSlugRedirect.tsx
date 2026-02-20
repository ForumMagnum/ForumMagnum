"use client";
import React from 'react';
import { usePostBySlug } from './usePost';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import PermanentRedirect from "../common/PermanentRedirect";
import Loading from "../vulcan-core/Loading";
import Error404 from "../common/Error404";

const PostsSingleSlugRedirect = ({slug}: {slug: string}) => {
  const { post, loading } = usePostBySlug({ slug });

  if (post) {
    const canonicalUrl = postGetPageUrl(post);
    return <PermanentRedirect url={canonicalUrl}/>
  } else {
    return loading ? <Loading/> : <Error404 />
  }
};

export default PostsSingleSlugRedirect;
