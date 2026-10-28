// EXPERIMENT (branch experiment/iframe-layout-ronny): a public, hard-to-guess demo of the editor with
// partial-width widgets the text wraps around. Nothing is saved.
import React from "react";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import { LayoutDemoEditor } from "@/components/posts/PostsPage/LayoutDemoEditor";
import { LAYOUT_DEMO_TITLE, buildLayoutDemoPostHtml } from "@/server/layoutDemo/layoutDemoHtml";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), await getPageTitleFields('Widget layout editor demo'), {
    robots: { index: false, follow: false },
  });
}

assertRouteAttributes("/experiment-iframe-layout-tuito7fob8u0rzrbib0v16i1/editor", {
  whiteBackground: true,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function Page() {
  return <RouteRoot>
    <LayoutDemoEditor title={LAYOUT_DEMO_TITLE} initialHtml={buildLayoutDemoPostHtml()} />
  </RouteRoot>;
}
