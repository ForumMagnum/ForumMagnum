import React from "react";
import RouteRoot from "@/components/next/RouteRoot";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import { PetrovDayPage } from "@/components/seasonal/petrovDay/petrov-day-story/PetrovDayStory";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Petrov Day'));
}


export default function PetrovDayStoryPage() {
  return <RouteRoot
    metadata={{ noFooter: true, background: '#f8f4ee' }}
  >
    <PetrovDayPage />
  </RouteRoot>;
}
