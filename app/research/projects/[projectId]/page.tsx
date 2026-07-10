import React from "react";
import ResearchWorkspace from '@/components/research/ResearchWorkspace';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Research Workspace'), {
    robots: { index: false },
  });
}

assertRouteAttributes("/research/projects/[projectId]", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default async function Page({ params }: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <RouteRoot fullscreen noFooter>
    <ResearchWorkspace projectId={projectId} />
  </RouteRoot>;
}
