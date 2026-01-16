import React from "react";
import AllWikiTagsPage from '@/components/tagging/AllWikiTagsPage';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Concepts Portal'));
}

export default function Page() {
  return <RouteRoot metadata={{ hasLeftNavigationColumn: false }}>
    <AllWikiTagsPage />
  </RouteRoot>;
}
