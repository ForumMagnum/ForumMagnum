import React from "react";
import EditTagPage from '@/components/tagging/EditTagPage';
import { TagPageSubtitle } from '@/components/tagging/TagPageSubtitle';
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug, { noIndex: true });

export default function Page() {
  return <RouteRoot metadata={{ subtitleComponent: TagPageSubtitle }}>
    <EditTagPage />
  </RouteRoot>;
}
