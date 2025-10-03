import React from "react";
import CommunityHome from '@/components/localGroups/CommunityHome';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Community'));
}

export default function Page() {
  return <RouteRoot>
    <CommunityHome />
  </RouteRoot>
}
