"use client";

import PostsNewForm from '@/components/posts/PostsNewForm';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>New Post</title></Helmet>
      <PostsNewForm />
    </>
  );
}
