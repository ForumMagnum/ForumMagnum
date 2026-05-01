import React from "react";
import TagCompareRevisions from '@/components/tagging/TagCompareRevisions';
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

assertRouteAttributes("/compare/w/[slug]", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug);

export default async function Page({ params }: {
  params: Promise<{ slug: string }>
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  return <RouteRoot>
    <TagCompareRevisions slug={slug} />
  </RouteRoot>;
}
