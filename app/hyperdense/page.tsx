import React from "react";
import HyperdensePostsPage from '@/components/posts/HyperdensePostsPage';
import { getDefaultMetadata, getMetadataDescriptionFields, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge(
    {},
    await getDefaultMetadata(),
    getMetadataDescriptionFields('Hyperdense post display'),
    getPageTitleFields('Hyperdense Posts')
  );
}

export default function Page() {
  return <RouteRoot metadata={{}}>
    <HyperdensePostsPage />
  </RouteRoot>;
}

