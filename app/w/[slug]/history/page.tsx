import React from "react";
import TagHistoryPage from '@/components/tagging/history/TagHistoryPage';
import { TagHistoryPageSubtitle } from '@/components/tagging/TagHistoryPageSubtitle';
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug, { historyPage: true, noIndex: true });

export default function Page() {
  return <RouteRoot subtitle={TagHistoryPageSubtitle}>
    <TagHistoryPage />
  </RouteRoot>;
}
