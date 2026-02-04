import React from "react";
import { htmlToMarkdown } from "../editor/conversionUtils";
import { renderToString } from "../emails/renderEmail";
import { NextResponse } from "next/server";

export const markdownClasses: Record<string, string> = {
  title: "markdown-title",
}

/**
 * Used in API endpoints to generate Markdown responses. Takes a React server
 * component tree, and renders it to Markdown. Elements in the provided tree
 * should not use any classes except those in `markdownClasses`.
 */
export async function markdownResponse(reactTree: React.ReactNode): Promise<Response> {
  const html = await renderToString(reactTree)
  const markdown = htmlToMarkdown(html)
  return new NextResponse(markdown, { status: 200 });
}
