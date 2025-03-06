"use client";

import AllTagsPage from '@/components/tagging/AllTagsPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Concepts Portal</title></Helmet>
      <AllTagsPage />
    </>
  );
}
