import React from "react";
import TagDiscussionPage from '@/components/tagging/TagDiscussionPage';
import { TagPageTitle } from '@/components/tagging/TagPageTitle';
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/components/layout/routeBackgroundColors";

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug);

assertRouteHasWhiteBackground("/w/[slug]/discussion");

export default async function Page({ params }: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  return <RouteRoot metadata={{
    titleComponent: TagPageTitle,
    subtitleComponent: TagPageTitle
  }}>
    <TagDiscussionPage slug={slug} />
  </RouteRoot>;
}

