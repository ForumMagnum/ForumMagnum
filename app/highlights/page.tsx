import React from "react";
import SequencesHighlightsCollection from '@/components/sequences/SequencesHighlightsCollection';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge(defaultMetadata, {
    title: 'Sequences Highlights',
  });
}

export default function Page() {
  return <SequencesHighlightsCollection />;
}
