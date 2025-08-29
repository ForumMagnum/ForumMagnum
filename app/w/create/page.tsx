import React from "react";
import NewTagPage from '@/components/tagging/NewTagPage';
import { TagPageTitle } from '@/components/tagging/TagPageTitle';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'New Wikitag',
  });
}

export default function Page() {
  return <RouteRoot metadata={{ background: 'white', subtitleComponent: TagPageTitle }}>
    <NewTagPage />
  </RouteRoot>;
}
