import React from "react";
import TaggingDashboard from '@/components/tagging/TaggingDashboard';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Wikitag Dashboard'));
}

export default function Page() {
  return <RouteRoot subtitle={{ title: 'Wikitags Dashboard', link: '/wikitags/dashboard' }}>
    <TaggingDashboard />
  </RouteRoot>;
}
