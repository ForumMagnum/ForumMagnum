import { escapeHtml } from "@/lib/utils/sanitize";

interface RssPostContent {
  "content:encoded"?: unknown;
  description?: unknown;
  summary?: unknown;
  title?: unknown;
  link?: unknown;
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function getRssPostContents(rssPost: RssPostContent, displayFullContent: boolean): string {
  const fullContent = getString(rssPost["content:encoded"]);
  if (displayFullContent && fullContent) {
    return fullContent;
  }

  return getString(rssPost.description) || getString(rssPost.summary);
}

export function getRssQuickTakeContents(rssPost: RssPostContent, displayFullContent: boolean): string {
  const title = getString(rssPost.title);
  const link = getString(rssPost.link);
  const body = getRssPostContents(rssPost, displayFullContent);

  let linkedTitle = "";
  if (title && link) {
    linkedTitle = `<p><strong><a href="${escapeHtml(link)}">${escapeHtml(title)}</a></strong></p>`;
  } else if (title) {
    linkedTitle = `<p><strong>${escapeHtml(title)}</strong></p>`;
  } else if (link) {
    linkedTitle = `<p><a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p>`;
  }

  return [linkedTitle, body].filter(Boolean).join("\n");
}
