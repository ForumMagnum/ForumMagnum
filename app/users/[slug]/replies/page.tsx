"use client";

import UserCommentsReplies from '@/components/comments/UserCommentsReplies';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>User Comment Replies</title></Helmet>
      <UserCommentsReplies />
    </>
  );
}
