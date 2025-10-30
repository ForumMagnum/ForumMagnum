import React from "react";
import ArbitalExplorePage from '@/components/tagging/ArbitalExplorePage';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";
import { suggestedTimeouts } from "@/server/pageTimeouts";

export const maxDuration = suggestedTimeouts.potentiallySlowPage;

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Arbital'));
}

export default function Page() {
  return <RouteRoot>
    <ArbitalExplorePage />
  </RouteRoot>
}
