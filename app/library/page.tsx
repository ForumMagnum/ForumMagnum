import React from "react";
import LibraryPage from '@/components/sequences/LibraryPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";
import { isAF } from "@/lib/forumTypeUtils";
import AFLibraryPage from "@/components/alignment-forum/AFLibraryPage";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'The Library',
  });
}

export default function Page() {
  return <RouteRoot metadata={{ hasLeftNavigationColumn: true }}>
    {isAF() ? <AFLibraryPage /> : <LibraryPage />}
  </RouteRoot>;
}
