import React from "react";
import EventsPast from '@/components/posts/EventsPast';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Past Events by Day'));
}

export default function Page() {
  return <RouteRoot>
    <EventsPast />
  </RouteRoot>
}
