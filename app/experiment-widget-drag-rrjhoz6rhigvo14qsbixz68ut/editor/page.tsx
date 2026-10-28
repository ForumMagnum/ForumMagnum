// EXPERIMENT (experiment/iframe-layout-ronny-exp2): Experiment 2, a public, hard-to-guess demo of the
// editor where widgets are placed by dragging them (and pulling their edges to resize them). Nothing
// is saved. Its Post tab opens the existing demo post.
import React from "react";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import { LayoutDemoEditor } from "@/components/posts/PostsPage/LayoutDemoEditor";
import { LAYOUT_DEMO_TITLE, buildLayoutDemoPostHtml } from "@/server/layoutDemo/layoutDemoHtml";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), await getPageTitleFields('Widget drag editor demo'), {
    robots: { index: false, follow: false },
  });
}

assertRouteAttributes("/experiment-widget-drag-rrjhoz6rhigvo14qsbixz68ut/editor", {
  whiteBackground: true,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function Page() {
  return <RouteRoot>
    <LayoutDemoEditor title={LAYOUT_DEMO_TITLE} initialHtml={buildLayoutDemoPostHtml()} widgetDrag />
  </RouteRoot>;
}
