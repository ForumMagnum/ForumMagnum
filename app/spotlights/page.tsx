import React from "react";
import SpotlightsPage from '@/components/spotlights/SpotlightsPage';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'Spotlights Page',
  });
}

export default function Page() {
  return <SpotlightsPage />;
}
