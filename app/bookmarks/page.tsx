import React from "react";
import BookmarksPage from '@/components/bookmarks/BookmarksPage';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'Bookmarks',
  });
}

export default function Page() {
  return <BookmarksPage />;
}
