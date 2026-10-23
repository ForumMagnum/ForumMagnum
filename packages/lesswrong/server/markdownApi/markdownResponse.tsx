import type { ForumTypeString } from "@/lib/instanceSettings";
import React from "react";
import { htmlToMarkdown } from "../editor/conversionUtils";
import { renderToString } from "../emails/renderEmail";
import { NextResponse } from "next/server";
import { siteUrlSetting } from "@/lib/instanceSettings";
import { combineUrls } from "@/lib/vulcan-lib/utils";
import { makeMarkdownLinksAbsolute } from "./markdownLinks";

export const markdownClasses: Record<string, string> = {
  title: "markdown-title",
}

/**
 * Used in API endpoints to generate Markdown responses. Takes a React server
 * component tree, and renders it to Markdown. Elements in the provided tree
 * should not use any classes except those in `markdownClasses`.
 */
export async function markdownResponse(reactTree: React.ReactNode, forumType: ForumTypeString, options?: {
  /** Make root-relative links absolute, for markdown that will be copied elsewhere */
  absoluteLinks?: boolean
}): Promise<Response> {
  const markdown = await renderReactToMarkdown(reactTree, forumType)
  const output = options?.absoluteLinks ? makeMarkdownLinksAbsolute(markdown, forumType) : markdown;
  return new NextResponse(output, { status: 200 });
}

export async function renderReactToMarkdown(reactTree: React.ReactNode, forumType: ForumTypeString): Promise<string> {
  const html = await renderToString(<div>
    <div>{reactTree}</div>

    <h3>Navigation</h3>
    <ul>
      <li><a href={`${combineUrls(siteUrlSetting.get(forumType), "/api/home")}`}>Front page</a></li>
      <li><a href={`${combineUrls(siteUrlSetting.get(forumType), "/api/SKILL.md")}`}>Markdown API documentation</a></li>
    </ul>
  </div>)
  return htmlToMarkdown(html)
}
