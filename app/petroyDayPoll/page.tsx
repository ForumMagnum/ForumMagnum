import React from "react";
import PetrovDayPoll from '@/components/seasonal/petrovDay/PetrovDayPoll';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Petrov Day Poll'));
}

export default function Page() {
  return <RouteRoot>
    <PetrovDayPoll />
  </RouteRoot>
}
