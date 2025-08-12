import React from "react";
import AllWikiTagsPage from '@/components/tagging/AllWikiTagsPage';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Concepts Portal',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ hasLeftNavigationColumn: false }} />
    <AllWikiTagsPage />
  </>;
}
