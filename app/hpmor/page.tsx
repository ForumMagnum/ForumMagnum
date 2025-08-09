import React from "react";
import HPMOR from '@/components/sequences/HPMOR';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'Harry Potter and the Methods of Rationality',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ subtitle: 'HPMoR', subtitleLink: '/hpmor' }} />
    <HPMOR />
  </>;
}
