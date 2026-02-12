import React from "react";
import { getSiteUrl } from "@/lib/vulcan-lib/utils";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import { escapeHtml } from "@/lib/utils/sanitize";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

assertRouteAttributes("/debug/markdownApi", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

const DEFAULT_MARKDOWN_URL = "/api/SKILL.md";

const toDebugUrl = (targetUrl: string): string =>
  `/debug/markdownApi?url=${encodeURIComponent(targetUrl)}`;

const renderMarkdownWithDebugLinks = (markdown: string): string => {
  const output: string[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(markdown)) !== null) {
    const [fullMatch, text, urlPart] = match;
    output.push(escapeHtml(markdown.slice(lastIndex, match.index)));

    const trimmedUrlPart = urlPart.trim();
    const rawUrl = trimmedUrlPart.split(/\s+/)[0].replace(/^<|>$/g, "");
    const debugUrl = toDebugUrl(rawUrl);

    output.push(
      `[${escapeHtml(text)}](` +
        `<a href="${escapeHtml(debugUrl)}">${escapeHtml(trimmedUrlPart)}</a>` +
      `)`
    );

    lastIndex = match.index + fullMatch.length;
  }

  output.push(escapeHtml(markdown.slice(lastIndex)));
  return output.join("");
};

const resolveMarkdownUrl = (urlParam: string | undefined): URL => {
  const baseUrl = getSiteUrl();
  const resolved = new URL(urlParam ?? DEFAULT_MARKDOWN_URL, baseUrl);
  const baseOrigin = new URL(baseUrl).origin;
  if (resolved.origin !== baseOrigin) {
    throw new Error("Only same-origin URLs are supported.");
  }
  return resolved;
};

export default async function DebugMarkdownApiPage({
  searchParams,
}: {
  searchParams?: Promise<{ url?: string }>;
}) {
  let markdown = "";
  let errorMessage = "";
  let resolvedUrl: URL | null = null;
  const searchParamsValue = await searchParams;

  try {
    resolvedUrl = resolveMarkdownUrl(searchParamsValue?.url);
    const response = await fetch(resolvedUrl.toString(), { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }
    markdown = await response.text();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown error.";
  }

  const displayedMarkdown = renderMarkdownWithDebugLinks(markdown);

  return (
    <RouteRoot>
      <h1>Markdown API Debug</h1>
      <form method="get">
        <label htmlFor="url">URL</label>{" "}
        <input
          id="url"
          name="url"
          defaultValue={searchParamsValue?.url ?? DEFAULT_MARKDOWN_URL}
        />{" "}
        <button type="submit">Load</button>
      </form>
      {resolvedUrl ? <p>Resolved URL: {resolvedUrl.toString()}</p> : null}
      {errorMessage ? <p>Error: {errorMessage}</p> : null}
      <SingleColumnSection>
        <pre>
          <code
            className="language-markdown"
            dangerouslySetInnerHTML={{ __html: displayedMarkdown }}
          />
        </pre>
      </SingleColumnSection>
    </RouteRoot>
  );
}
