import React from "react";
import RandomUserPage from '@/components/admin/RandomUserPage';
import { getDefaultMetadata, getPageTitleFields, mergeMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export const generateMetadata = (): Metadata => mergeMetadata(getPageTitleFields('Random User'));

assertRouteAttributes("/admin/random-user", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function Page() {
  return <RouteRoot>
    <RandomUserPage />
  </RouteRoot>
}
