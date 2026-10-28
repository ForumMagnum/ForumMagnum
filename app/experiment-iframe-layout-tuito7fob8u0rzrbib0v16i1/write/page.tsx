// EXPERIMENT (branch experiment/iframe-layout-ronny-claude-v1): write a post together with Claude, in the
// layout demo's editor. Without ?postId&key this makes a new shared draft and redirects to it; with them it
// opens that draft in the collaborative editor, next to the prompt that hands the draft to Claude.
import React from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import { LayoutDemoWriter } from "@/components/posts/PostsPage/LayoutDemoWriter";
import { LAYOUT_DEMO_PATH } from "@/components/posts/PostsPage/constants";
import { createClaudeWriterDraft, getClaudeWriterDraft } from "@/server/layoutDemo/claudeWriterDraft";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), await getPageTitleFields('Write with Claude (demo)'), {
    robots: { index: false, follow: false },
  });
}

assertRouteAttributes("/experiment-iframe-layout-tuito7fob8u0rzrbib0v16i1/write", {
  whiteBackground: true,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const params = await searchParams;
  const postId = typeof params.postId === "string" ? params.postId : null;
  const key = typeof params.key === "string" ? params.key : null;
  const draft = postId && key ? await getClaudeWriterDraft(postId, key) : null;
  if (!draft) {
    const created = await createClaudeWriterDraft();
    redirect(`${LAYOUT_DEMO_PATH}/write?postId=${created.postId}&key=${created.linkSharingKey}`);
  }
  return <RouteRoot>
    <LayoutDemoWriter postId={draft.postId} linkSharingKey={draft.linkSharingKey} title={draft.title} initialHtml={draft.html} />
  </RouteRoot>;
}
