import React from "react";
import NewTagPage from '@/components/tagging/NewTagPage';
import { TagPageTitle } from '@/components/tagging/TagPageTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge(defaultMetadata, {
    title: 'New Wikitag',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ background: 'white', subtitleComponent: TagPageTitle }} />
    <NewTagPage />
  </>;
}
