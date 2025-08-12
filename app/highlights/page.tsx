import React from "react";
import SequencesHighlightsCollection from '@/components/sequences/SequencesHighlightsCollection';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Sequences Highlights',
  });
}

export default function Page() {
  return <SequencesHighlightsCollection />;
}
