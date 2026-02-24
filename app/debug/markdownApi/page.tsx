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

const applyBasicMarkdownSyntaxHighlight = (html: string): string => {
  return html
    .replaceAll(/^(#{1,6}\s.*)$/gm, '<span class="mdHeading">$1</span>')
    .replaceAll(/^(```.*)$/gm, '<span class="mdFence">$1</span>')
    .replaceAll(/^(\s{0,3}(?:[-*+]|\d+\.)\s+)/gm, '<span class="mdListMarker">$1</span>')
    .replaceAll(/^(&gt;.*)$/gm, '<span class="mdBlockquote">$1</span>')
    .replaceAll(/(`[^`\n]+`)/g, '<span class="mdInlineCode">$1</span>');
};

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
  return applyBasicMarkdownSyntaxHighlight(output.join(""));
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
      <SingleColumnSection>
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
        {errorMessage ? <p>Error: {errorMessage}</p> : null}
      </SingleColumnSection>
      <SingleColumnSection>
        <pre className="markdownDebugPre">
          <code
            className="language-markdown markdownDebugCode"
            dangerouslySetInnerHTML={{ __html: displayedMarkdown }}
          />
        </pre>
      </SingleColumnSection>
      <style>{`
        .markdownDebugPre {
          max-width: 82ch;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          line-height: 1.45;
        }
        .markdownDebugCode {
          display: block;
          white-space: inherit;
          color: light-dark(#1f2937, #e5e7eb);
        }
        .markdownDebugCode a {
          color: light-dark(#1d4ed8, #93c5fd);
          text-decoration: underline;
        }
        .markdownDebugCode .mdHeading {
          color: light-dark(#0f172a, #f8fafc);
          font-weight: 700;
        }
        .markdownDebugCode .mdFence {
          color: light-dark(#7c3aed, #c4b5fd);
          font-weight: 600;
        }
        .markdownDebugCode .mdListMarker {
          color: light-dark(#2563eb, #93c5fd);
          font-weight: 600;
        }
        .markdownDebugCode .mdBlockquote {
          color: light-dark(#6b7280, #9ca3af);
          font-style: italic;
        }
        .markdownDebugCode .mdInlineCode {
          color: light-dark(#b45309, #fbbf24);
          background: light-dark(rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.22));
          border-radius: 3px;
          padding: 0 2px;
        }
      `}</style>
    </RouteRoot>
  );
}
