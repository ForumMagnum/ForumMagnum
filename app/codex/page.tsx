import React from "react";
import Codex from '@/components/sequences/Codex';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('The Codex'));
}

export default function Page() {
  return <RouteRoot metadata={{ subtitle: 'SlateStarCodex', subtitleLink: '/codex' }}>
    <Codex />
  </RouteRoot>;
}
