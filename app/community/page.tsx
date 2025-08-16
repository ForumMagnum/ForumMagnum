import React from "react";
import CommunityHome from '@/components/localGroups/CommunityHome';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Community'));
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ subtitle: 'Community', subtitleLink: '/community' }} />
    <CommunityHome />
  </>;
}
