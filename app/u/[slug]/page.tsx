import React from "react";
import { generateUserPageMetadata } from "@/server/pageMetadata/userPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import UsersSingle from "@/components/users/UsersSingle";

assertRouteAttributes("/u/[slug]", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export const generateMetadata = generateUserPageMetadata;

export default async function Page({ params }: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  return <RouteRoot delayedStatusCode>
    <UsersSingle slug={slug} />
  </RouteRoot>
}
