"use client";
export const dynamic = 'force-dynamic';

import TopPostsPage from '@/components/sequences/TopPostsPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>The Best of LessWrong</title></Helmet>
      <TopPostsPage />
    </>
  );
}
