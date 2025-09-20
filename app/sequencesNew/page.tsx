import React from "react";
import SequencesNewForm from '@/components/sequences/SequencesNewForm';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'New Sequence',
  });
}

export default function Page() {
  return <RouteRoot>
    <SequencesNewForm />
  </RouteRoot>
}
