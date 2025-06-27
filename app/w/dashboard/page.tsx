import React from "react";
import TaggingDashboard from '@/components/tagging/TaggingDashboard';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge(defaultMetadata, {
    title: 'Wikitag Dashboard',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ subtitle: 'Wikitags Dashboard', subtitleLink: '/wikitags/dashboard' }} />
    <TaggingDashboard />
  </>;
}
