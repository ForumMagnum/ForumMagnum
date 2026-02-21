import { NextRequest } from "next/server";

export function GET(req: NextRequest) {
  const requestedPath =
    req.headers.get("x-markdown-unavailable-from") ??
    req.nextUrl.searchParams.get("from") ??
    "(unknown)";
  const markdown = [
    "# Markdown Version Not Available",
    "",
    `The page \`${requestedPath}\` does not currently have a Markdown variant.`,
    "",
    "To get the HTML/SPA version of this page, remove the Accept header from your request or change it to text/html or */*.",
    "Or try one of these markdown-friendly pages instead:",
    "",
    "- `/api/SKILL.md` for markdown API docs",
    "- `/api/home` for front page content",
  ].join("\n");

  return new Response(markdown, {
    status: 406,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
