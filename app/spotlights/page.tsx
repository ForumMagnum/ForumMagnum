import React from "react";
import SpotlightsPage from '@/components/spotlights/SpotlightsPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Spotlights Page',
  });
}

export default function Page() {
  return <RouteRoot>
    <SpotlightsPage />
  </RouteRoot>
}
