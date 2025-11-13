import React from "react";
import CoreSequences from '@/components/sequences/CoreSequences';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Rationality: A-Z',
  });
}

export default function Page() {
  return <RouteRoot>
    <CoreSequences />
  </RouteRoot>
}
