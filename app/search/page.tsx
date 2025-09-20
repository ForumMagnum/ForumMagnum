import React from "react";
import SearchPageTabbed from '@/components/search/SearchPageTabbed';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Search'));
}

export default function Page() {
  return <RouteRoot metadata={{ background: 'white' }}>
    <SearchPageTabbed />
  </RouteRoot>;
}
