import React from "react";
import TagHistoryPage from '@/components/tagging/history/TagHistoryPage';
import { TagHistoryPageSubtitle } from '@/components/tagging/TagHistoryPageSubtitle';
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

assertRouteAttributes("/w/[slug]/history", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug, { historyPage: true, noIndex: true });

export default async function Page({ params }: {
  params: Promise<{ slug: string }>
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  
  return <RouteRoot subtitle={TagHistoryPageSubtitle}>
    <TagHistoryPage slug={slug} />
  </RouteRoot>;
}
