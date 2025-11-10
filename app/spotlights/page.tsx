import React from "react";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";
import SpotlightsSchedulePage from "@/components/spotlights/SpotlightsSchedulePage";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Spotlights Page',
  });
}

export default function Page() {
  return <RouteRoot>
    <SpotlightsSchedulePage/>
  </RouteRoot>
}
