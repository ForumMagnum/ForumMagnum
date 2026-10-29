// EXPERIMENT (experiment/iframe-layout-ronny-exp3): Experiment 3, a public, hard-to-guess demo of the drag
// editor with every kind of content block next to partial-width widgets. This page has the AI Futures
// post (as in Experiment 2); the bar switches to the second demo post. Nothing is saved to the database.
import React from "react";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import { LayoutDemoEditor } from "@/components/posts/PostsPage/LayoutDemoEditor";
import { LAYOUT_DEMO_TITLE, buildWidgetDragDemoHtml } from "@/server/layoutDemo/layoutDemoHtml";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), await getPageTitleFields('Widget blocks editor demo'), {
    robots: { index: false, follow: false },
  });
}

assertRouteAttributes("/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e/editor", {
  whiteBackground: true,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function Page() {
  return <RouteRoot>
    <LayoutDemoEditor title={LAYOUT_DEMO_TITLE} initialHtml={buildWidgetDragDemoHtml()} blocksDemo="ai-futures" />
  </RouteRoot>;
}
