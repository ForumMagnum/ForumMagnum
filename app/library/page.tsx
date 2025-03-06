"use client";

import LibraryPage from '@/components/sequences/LibraryPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>The Library</title></Helmet>
      <LibraryPage />
    </>
  );
}
