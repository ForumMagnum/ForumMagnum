import React from "react";
import Hpmor from '@/components/sequences/HPMOR';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Harry Potter and the Methods of Rationality'));
}

assertRouteAttributes("/hpmor", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function Page() {
  return <RouteRoot subtitle={{ title: 'HPMoR', link: '/hpmor' }}>
    <Hpmor />
  </RouteRoot>;
}
