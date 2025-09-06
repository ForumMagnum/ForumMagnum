import React from "react";
import ShortformPage from '@/components/shortform/ShortformPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Quick Takes',
  });
}

export default function Page() {
  return <RouteRoot metadata={{ hasLeftNavigationColumn: true }}>
    <ShortformPage />
  </RouteRoot>;
}
