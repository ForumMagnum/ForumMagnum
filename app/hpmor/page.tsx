import React from "react";
import Hpmor from '@/components/sequences/HPMOR';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Harry Potter and the Methods of Rationality',
  });
}

export default function Page() {
  return <RouteRoot metadata={{ subtitle: 'HPMoR', subtitleLink: '/hpmor' }}>
    <Hpmor />
  </RouteRoot>;
}
