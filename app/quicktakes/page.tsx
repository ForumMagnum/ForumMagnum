import React from "react";
import ShortformPage from '@/components/shortform/ShortformPage';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'Quick Takes',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ hasLeftNavigationColumn: true }} />
    <ShortformPage />
  </>;
}
