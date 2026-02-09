import React from "react";
import TagHistoryPage from '@/components/tagging/history/TagHistoryPage';
import { TagHistoryPageTitle } from '@/components/tagging/TagHistoryPageTitle';
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug, { historyPage: true, noIndex: true });

export default async function Page({ params }: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  
  return <RouteRoot metadata={{
    titleComponent: TagHistoryPageTitle,
    subtitleComponent: TagHistoryPageTitle
  }}>
    <TagHistoryPage slug={slug} />
  </RouteRoot>;
}
