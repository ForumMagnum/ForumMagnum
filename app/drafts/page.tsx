import React from "react";
import DraftsPage from '@/components/posts/DraftsPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/components/layout/routeBackgroundColors";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Drafts & Unpublished',
  });
}

assertRouteHasWhiteBackground("/drafts");

export default function Page() {
  return <RouteRoot>
    <DraftsPage />
  </RouteRoot>;
}
