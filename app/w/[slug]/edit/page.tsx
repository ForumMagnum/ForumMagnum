import React from "react";
import EditTagPage from '@/components/tagging/EditTagPage';
import { TagPageTitle } from '@/components/tagging/TagPageTitle';
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";
import RouteRoot from "@/components/next/RouteRoot";

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug, { noIndex: true });

export default function Page() {
  return <RouteRoot metadata={{ titleComponent: TagPageTitle, subtitleComponent: TagPageTitle }}>
    <EditTagPage />
  </RouteRoot>;
}
