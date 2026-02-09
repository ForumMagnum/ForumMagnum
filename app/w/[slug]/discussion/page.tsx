import React from "react";
import TagDiscussionPage from '@/components/tagging/TagDiscussionPage';
import { TagPageSubtitle } from '@/components/tagging/TagPageSubtitle';
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/components/layout/routeBackgroundColors";

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug);

assertRouteHasWhiteBackground("/w/[slug]/discussion");

export default function Page() {
  return <RouteRoot subtitle={TagPageSubtitle}>
    <TagDiscussionPage />
  </RouteRoot>;
}

