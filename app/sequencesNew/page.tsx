import React from "react";
import SequencesNewForm from '@/components/sequences/SequencesNewForm';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('New Sequence'));
}

export default function Page() {
  return <RouteRoot>
    <SequencesNewForm />
  </RouteRoot>
}
