import React from "react";
import TagMergePage from '@/components/tagging/TagMergePage';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Wikitag merging tool'));
}

export default function Page() {
  return <RouteRoot>
    <TagMergePage />
  </RouteRoot>
}
