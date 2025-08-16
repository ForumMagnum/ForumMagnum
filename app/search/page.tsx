import React from "react";
import SearchPageTabbed from '@/components/search/SearchPageTabbed';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Search'));
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ background: 'white' }} />
    <SearchPageTabbed />
  </>;
}
