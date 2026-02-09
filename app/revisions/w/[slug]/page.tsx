import React from "react";
import TagPageRevisionSelect from '@/components/revisions/TagPageRevisionSelect';
import { TagPageTitle } from '@/components/tagging/TagPageTitle';
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug);

export default async function Page({ params }: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  return <RouteRoot metadata={{ titleComponent: TagPageTitle }}>
    <TagPageRevisionSelect slug={slug} />
  </RouteRoot>;
}
