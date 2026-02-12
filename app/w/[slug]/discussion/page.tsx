import React from "react";
import TagDiscussionPage from '@/components/tagging/TagDiscussionPage';
import { TagPageSubtitle } from '@/components/tagging/TagPageSubtitle';
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/lib/routeChecks/routeBackgroundColors";

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug);

assertRouteHasWhiteBackground("/w/[slug]/discussion");

export default async function Page({ params }: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  return <RouteRoot subtitle={TagPageSubtitle}>
    <TagDiscussionPage slug={slug} />
  </RouteRoot>;
}

