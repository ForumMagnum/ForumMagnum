import React from "react";
import LibraryPage from '@/components/sequences/LibraryPage';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'The Library',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ hasLeftNavigationColumn: true }} />
    <LibraryPage />
  </>;
}
