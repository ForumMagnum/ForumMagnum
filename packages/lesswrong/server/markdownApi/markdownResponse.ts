import React from "react";
import { htmlToMarkdown } from "../editor/conversionUtils";
import { renderToString } from "../emails/renderEmail";

export const markdownClasses: Record<string, string> = {
  section: "section",
  markdown: "markdown",
}

/**
 * Used in API endpoints to generate Markdown responses. Takes a React server
 * component tree, and renders it to Markdown. Elements in the provided tree
 * should not use any classes except those in `markdownClasses`.
 */
export async function markdownResponse(reactTree: React.ReactNode): Promise<string> {
  // TODO: Optimize and fine tune the formatting here
  const html = await renderToString(reactTree)
  const markdown = htmlToMarkdown(html)
  return markdown
}
