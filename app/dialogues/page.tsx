import React from "react";
import DialoguesPage from '@/components/dialogues/DialoguesPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'All Dialogues',
  });
}

export default function Page() {
  return <RouteRoot>
    <DialoguesPage />
  </RouteRoot>
}
