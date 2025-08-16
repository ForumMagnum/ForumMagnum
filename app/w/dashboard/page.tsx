import React from "react";
import TaggingDashboard from '@/components/tagging/TaggingDashboard';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Wikitag Dashboard',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ subtitle: 'Wikitags Dashboard', subtitleLink: '/wikitags/dashboard' }} />
    <TaggingDashboard />
  </>;
}
