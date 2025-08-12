import React from "react";
import TopPostsPage from '@/components/sequences/TopPostsPage';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
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
