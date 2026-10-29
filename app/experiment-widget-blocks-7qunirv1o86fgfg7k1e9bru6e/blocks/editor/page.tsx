// EXPERIMENT (experiment/iframe-layout-ronny-exp3): Experiment 3's editor with its second demo post, "How
// content blocks behave next to widgets". Nothing is saved to the database.
import React from "react";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import { LayoutDemoEditor } from "@/components/posts/PostsPage/LayoutDemoEditor";
import { BLOCKS_DEMO_TITLE } from "@/components/posts/PostsPage/widgetBlocksDemo";
import { buildBlocksDemoHtml } from "@/server/layoutDemo/blocksDemoHtml";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), await getPageTitleFields('Content blocks editor demo'), {
    robots: { index: false, follow: false },
  });
}

assertRouteAttributes("/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e/blocks/editor", {
  whiteBackground: true,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function Page() {
  return <RouteRoot>
    <LayoutDemoEditor title={BLOCKS_DEMO_TITLE} initialHtml={buildBlocksDemoHtml()} blocksDemo="blocks" />
  </RouteRoot>;
}
