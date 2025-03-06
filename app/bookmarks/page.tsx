"use client";

import BookmarksPage from '@/components/bookmarks/BookmarksPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Bookmarks</title></Helmet>
      <BookmarksPage />
    </>
  );
}
