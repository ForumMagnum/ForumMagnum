"use client";

import AllComments from '@/components/comments/AllComments';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>All Comments</title></Helmet>
      <AllComments />
    </>
  );
}
