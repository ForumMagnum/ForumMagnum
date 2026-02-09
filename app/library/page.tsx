import React from "react";
import LibraryPage from '@/components/sequences/LibraryPage';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { isAF } from "@/lib/forumTypeUtils";
import AFLibraryPage from "@/components/alignment-forum/AFLibraryPage";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('The Library'));
}

export default function Page() {
  return <RouteRoot>
    {isAF() ? <AFLibraryPage /> : <LibraryPage />}
  </RouteRoot>;
}
