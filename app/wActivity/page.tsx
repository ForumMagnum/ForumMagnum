import React from "react";
import TagVoteActivity from '@/components/tagging/TagVoteActivity';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Wikitag Voting Activity'));
}

export default function Page() {
  return <RouteRoot>
    <TagVoteActivity />
  </RouteRoot>
}
