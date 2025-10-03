import React from "react";
import TaggingDashboard from '@/components/tagging/TaggingDashboard';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Wikitag Dashboard',
  });
}

export default function Page() {
  return <RouteRoot metadata={{ subtitle: 'Wikitags Dashboard', subtitleLink: '/wikitags/dashboard' }}>
    <TaggingDashboard />
  </RouteRoot>;
}
