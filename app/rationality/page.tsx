import React from "react";
import CoreSequences from '@/components/sequences/CoreSequences';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Rationality: A-Z',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ subtitle: 'Rationality: A-Z', subtitleLink: '/rationality' }} />
    <CoreSequences />
  </>;
}
