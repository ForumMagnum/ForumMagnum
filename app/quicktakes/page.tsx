import React from "react";
import ShortformPage from '@/components/shortform/ShortformPage';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Quick Takes',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ hasLeftNavigationColumn: true }} />
    <ShortformPage />
  </>;
}
