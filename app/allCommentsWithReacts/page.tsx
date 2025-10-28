import React from "react";
import AllReactedCommentsPage from '@/components/sunshineDashboard/AllReactedCommentsPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'All Comments with Reacts',
  });
}

export default function Page() {
  return <RouteRoot>
    <AllReactedCommentsPage />
  </RouteRoot>
}
