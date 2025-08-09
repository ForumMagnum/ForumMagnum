import React from "react";
import TopPostsPage from '@/components/sequences/TopPostsPage';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'The Best of LessWrong',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{
      subtitle: 'The Best of LessWrong',
      subtitleLink: '/leastwrong',
      background: '#f8f4ee'
    }} />
    <TopPostsPage />
  </>;
}
