import React from "react";
import HPMOR from '@/components/sequences/HPMOR';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Harry Potter and the Methods of Rationality',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ subtitle: 'HPMoR', subtitleLink: '/hpmor' }} />
    <HPMOR />
  </>;
}
