import React from "react";
import { generateUserPageMetadata } from "@/server/pageMetadata/userPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";
import ProfilePage from "./ProfilePage";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export const generateMetadata = generateUserPageMetadata;

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
  return <RouteRoot
    delayedStatusCode
  >
    <ProfilePage slug={slug}/>
  </RouteRoot>;
}
