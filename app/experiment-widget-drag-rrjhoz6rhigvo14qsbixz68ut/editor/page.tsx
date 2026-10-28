// EXPERIMENT (experiment/iframe-layout-ronny-exp2): Experiment 2, a public, hard-to-guess demo of the
// editor where widgets are placed by dragging them (and pulling their edges to resize them). Nothing
// is saved. Its Post tab opens the existing demo post. Its post has one more widget than that one, a
// fixed-width "first draft", which shows the editor's shrink warning.
import React from "react";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import { LayoutDemoEditor } from "@/components/posts/PostsPage/LayoutDemoEditor";
import { LAYOUT_DEMO_TITLE, buildWidgetDragDemoHtml } from "@/server/layoutDemo/layoutDemoHtml";
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
    <LayoutDemoEditor title={LAYOUT_DEMO_TITLE} initialHtml={buildWidgetDragDemoHtml()} widgetDrag />
  </RouteRoot>;
}
