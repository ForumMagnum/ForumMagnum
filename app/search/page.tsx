import React from "react";
import SearchPageTabbed from '@/components/search/SearchPageTabbed';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'Search',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ background: 'white' }} />
    <SearchPageTabbed />
  </>;
}
