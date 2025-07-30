import React from "react";
import Codex from '@/components/sequences/Codex';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'The Codex',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ subtitle: 'SlateStarCodex', subtitleLink: '/codex' }} />
    <Codex />
  </>;
}
