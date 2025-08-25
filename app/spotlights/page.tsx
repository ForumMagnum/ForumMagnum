import React from "react";
import SpotlightsPage from '@/components/spotlights/SpotlightsPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Spotlights Page',
  });
}

export default function Page() {
  return <SpotlightsPage />;
}
