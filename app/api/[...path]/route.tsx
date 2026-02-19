import { NextRequest } from "next/server";
import { markdownClasses, renderReactToMarkdown } from "@/server/markdownApi/markdownResponse";
import { escapeHtml } from "@/lib/utils/sanitize";

const renderMarkdownNotFound = async (path: string): Promise<Response> => {
  const markdown = await renderReactToMarkdown(
    <div>
      <div className={markdownClasses.title}>404 Not Found</div>
      <div>
        No API route matches {path}<br/>
        Look at /api/SKILL.md for information about suggested API routes.
      </div>
    </div>
  );

  return new Response(markdown, {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};

const renderHtmlNotFound = (path: string): Response => {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Markdown API: Not Found</title>
  </head>
  <body>
    <h1>Markdown API: Not Found</h1>
    <p>No API route matches <code>${escapeHtml(path)}</code>.</p>
    <p>See <a href="/api/SKILL.md">/api/SKILL.md</a> for suggested routes.</p>
  </body>
</html>`;

  return new Response(html, {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
};

const renderJsonNotFound = (path: string): Response => {
  const json = {
    error: "Not Found",
    path,
    documentation: "/api/SKILL.md",
  };
  return new Response(JSON.stringify(json, null, 2), {
    status: 404,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};

export async function GET(req: NextRequest) {
  const acceptHeader = req.headers.get("accept")?.toLowerCase() ?? "";
  const wantsHtml = acceptHeader.includes("text/html") || acceptHeader.includes("application/xhtml+xml");
  const wantsJson = acceptHeader.includes("application/json") || acceptHeader.includes("text/json");
  const wantsMarkdown = acceptHeader.includes("text/markdown") || acceptHeader.includes("text/plain");

  if (wantsHtml) {
    return renderHtmlNotFound(req.nextUrl.pathname);
  }

  if (wantsJson) {
    return renderJsonNotFound(req.nextUrl.pathname);
  }

  if (wantsMarkdown) {
    return renderMarkdownNotFound(req.nextUrl.pathname);
  }

  return renderMarkdownNotFound(req.nextUrl.pathname);
}
