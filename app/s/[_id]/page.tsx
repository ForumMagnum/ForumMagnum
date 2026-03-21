import React from "react";
import SequencesSingle, { SearchParamsForSequencePage } from '@/components/sequences/SequencesSingle';
import { SequencesPageSubtitle } from '@/components/titles/SequencesPageSubtitle';
import type { Metadata } from "next";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import { generateSequencePageMetadata } from "@/server/pageMetadata/sequencePageMetadata";

assertRouteAttributes("/s/[_id]", {
  whiteBackground: false,
  hasLinkPreview: true,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: true,
});

export async function generateMetadata({ params, searchParams }: {
  params: Promise<{ _id: string }>
  searchParams: Promise<{}>,
}): Promise<Metadata> {
  return generateSequencePageMetadata({ params, searchParams });
}

export default async function Page({ params, searchParams }: {
  params: Promise<{ _id: string }>
  searchParams: Promise<SearchParamsForSequencePage>
}) {
  const { _id } = await params;

  return <RouteRoot delayedStatusCode subtitle={SequencesPageSubtitle}>
    <SequencesSingle idOrSlug={_id} searchParams={searchParams} redirectBehavior="redirectToCanonical" />
  </RouteRoot>;
}
