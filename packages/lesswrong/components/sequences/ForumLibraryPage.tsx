"use client";

import React from 'react';
import { useForumType } from '@/components/hooks/useForumType';
import AFLibraryPage from '@/components/alignment-forum/AFLibraryPage';
import LibraryPage from './LibraryPage';

export default function ForumLibraryPage() {
  const { isAF } = useForumType();
  return isAF ? <AFLibraryPage /> : <LibraryPage />;
}
