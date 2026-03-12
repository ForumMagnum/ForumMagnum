import React from "react";
import AnnualReviewPage from '@/components/review/AnnualReviewPage';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Review Quick Page'));
}

assertRouteAttributes("/quickReview/[year]", {
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
  return <RouteRoot subtitle="Quick Review Page">
    <AnnualReviewPage year={year} />
  </RouteRoot>;
}
