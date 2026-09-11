import React from "react";
import EditTagPage from '@/components/tagging/EditTagPage';
import { TagPageSubtitle } from '@/components/tagging/TagPageSubtitle';
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

assertRouteAttributes("/w/[slug]/edit", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug, { noIndex: true });

export default async function Page({ params }: {
  params: Promise<{ slug: string }>
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  return <RouteRoot subtitle={TagPageSubtitle}>
    <EditTagPage slug={slug} />
  </RouteRoot>;
}
