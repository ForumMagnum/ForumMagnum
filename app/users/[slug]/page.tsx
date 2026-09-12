import React from "react";
import { generateUserPageMetadata } from "@/server/pageMetadata/userPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import UsersSingle from "./UsersSingle";

export const generateMetadata = generateUserPageMetadata;

// Profile metadata uses uncached, permission-aware queries on each request.
// Allow navigation to wait for it rather than requiring instant navigation.
export const instant = false;

assertRouteAttributes("/users/[slug]", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: true,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: true,
});

export default async function Page({ params }: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  return <RouteRoot delayedStatusCode>
    <UsersSingle slug={slug}/>
  </RouteRoot>;
}
