"use client";

import AllPostsPage from '@/components/posts/AllPostsPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>All Posts</title></Helmet>
      <AllPostsPage />
    </>
  );
}
