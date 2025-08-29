import React from "react";
import SequencesHighlightsCollection from '@/components/sequences/SequencesHighlightsCollection';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Sequences Highlights',
  });
}

export default function Page() {
  return <RouteRoot>
    <SequencesHighlightsCollection />
  </RouteRoot>
}
