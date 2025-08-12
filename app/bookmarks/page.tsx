import React from "react";
import BookmarksPage from '@/components/bookmarks/BookmarksPage';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Bookmarks'));
}

export default function Page() {
  return <BookmarksPage />;
}
