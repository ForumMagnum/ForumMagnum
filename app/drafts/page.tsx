"use client";

import DraftsPage from '@/components/posts/DraftsPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Drafts & Unpublished</title></Helmet>
      <DraftsPage />
    </>
  );
}
