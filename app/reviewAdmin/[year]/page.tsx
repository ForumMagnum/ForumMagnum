import React from "react";
import ReviewAdminDashboard from '@/components/review/ReviewAdminDashboard';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Review Admin Dashboard'));
}

assertRouteAttributes("/reviewAdmin/[year]", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default async function Page({ params }: {
  params: Promise<{ year: string }>
}) {
  const { year } = await params;
  return <RouteRoot>
    <ReviewAdminDashboard year={year} />
  </RouteRoot>;
}
