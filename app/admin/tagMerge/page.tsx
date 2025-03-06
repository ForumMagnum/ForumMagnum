"use client";

import TagMergePage from '@/components/tagging/TagMergePage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Tag merging tool</title></Helmet>
      <TagMergePage />
    </>
  );
}
