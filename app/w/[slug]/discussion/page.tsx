import React from "react";
import TagDiscussionPage from '@/components/tagging/TagDiscussionPage';
import { TagPageTitle } from '@/components/tagging/TagPageTitle';
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";
import RouteRoot from "@/components/next/RouteRoot";

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug);

export default function Page() {
  return <RouteRoot metadata={{
    background: 'white',
    titleComponent: TagPageTitle,
    subtitleComponent: TagPageTitle
  }}>
    <TagDiscussionPage />
  </RouteRoot>;
}

