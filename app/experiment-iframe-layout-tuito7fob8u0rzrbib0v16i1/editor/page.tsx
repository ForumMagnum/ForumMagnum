// EXPERIMENT (branch experiment/iframe-layout-ronny): a public, hard-to-guess demo of the editor with
// partial-width widgets the text wraps around. Nothing is saved.
import React from "react";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import { LayoutDemoEditor } from "@/components/posts/PostsPage/LayoutDemoEditor";
import { LAYOUT_DEMO_TITLE, buildLayoutDemoPostHtml } from "@/server/layoutDemo/layoutDemoHtml";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), await getPageTitleFields('Widget layout editor demo'), {
    robots: { index: false, follow: false },
  });
}

export default function Page() {
  return <RouteRoot>
    <LayoutDemoEditor title={LAYOUT_DEMO_TITLE} initialHtml={buildLayoutDemoPostHtml()} />
  </RouteRoot>;
}
