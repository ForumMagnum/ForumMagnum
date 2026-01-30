import React from "react";
import AllGroupsPage from '@/components/localGroups/AllGroupsPage';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('All Local Groups'));
}

export default function Page() {
  return <RouteRoot>
    <AllGroupsPage />
  </RouteRoot>
}
