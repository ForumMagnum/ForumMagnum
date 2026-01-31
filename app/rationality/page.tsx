import React from "react";
import CoreSequences from '@/components/sequences/CoreSequences';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Rationality: A-Z'));
}

export default function Page() {
  return <RouteRoot subtitle={{ title: 'Rationality: A-Z', link: '/rationality' }}>
    <CoreSequences />
  </RouteRoot>;
}
