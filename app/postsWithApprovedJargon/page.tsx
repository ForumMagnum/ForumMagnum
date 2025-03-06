"use client";

import PostsWithApprovedJargonPage from '@/components/jargon/PostsWithApprovedJargonPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Posts with approved jargon</title></Helmet>
      <PostsWithApprovedJargonPage />
    </>
  );
}
