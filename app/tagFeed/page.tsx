"use client";

import TagActivityFeed from '@/components/tagging/TagActivityFeed';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Tag Activity</title></Helmet>
      <TagActivityFeed />
    </>
  );
}
