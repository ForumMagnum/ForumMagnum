import React from "react";
import InboxWrapper from '@/components/messaging/InboxWrapper';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Inbox'));
}

assertRouteAttributes("/inbox", {
  whiteBackground: false,
  hasLinkPreview: true,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function Page() {
  return <RouteRoot
    delayedStatusCode
    noFooter
    fullscreen
  >
    <InboxWrapper />
  </RouteRoot>
}
