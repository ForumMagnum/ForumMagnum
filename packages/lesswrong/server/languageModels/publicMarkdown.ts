import { siteUrlSetting } from "@/lib/instanceSettings";
import { getMarkdownPathname } from "@/lib/routeChecks/markdownVersionRoutes";
import { combineUrls } from "@/lib/vulcan-lib/utils";

const MAX_PAGE_CHARACTERS = 60_000;
const FORUM_HOSTNAMES = ["lesswrong.com", "alignmentforum.org"];

export function getPublicMarkdownPath(urlOrPath: string): string | null {
  const siteUrl = new URL(siteUrlSetting.get("LessWrong"));
  let url: URL;
  try {
    url = new URL(urlOrPath, siteUrl);
  } catch {
    return null;
  }
  const isForumHostname = FORUM_HOSTNAMES.some(hostname => url.hostname === hostname || url.hostname.endsWith(`.${hostname}`));
  if (url.hostname !== siteUrl.hostname && !isForumHostname) {
    return null;
  }
  if (url.pathname.startsWith("/api/")) {
    return `${url.pathname}${url.search}`;
  }

  const markdownPathname = getMarkdownPathname(url.pathname);
  const commentId = url.searchParams.get("commentId");
  if (markdownPathname?.startsWith("/api/post/") && commentId) {
    return `${markdownPathname}/comments/${commentId}`;
  }
  return markdownPathname;
}

export async function fetchPublicMarkdown(markdownPath: string): Promise<string> {
  const response = await fetch(combineUrls(siteUrlSetting.get("LessWrong"), markdownPath), {
    headers: { Accept: "text/markdown" },
  });
  if (!response.ok) {
    throw new Error(`Fetching ${markdownPath} failed with status ${response.status}`);
  }
  const markdown = await response.text();
  return markdown.length > MAX_PAGE_CHARACTERS
    ? `${markdown.slice(0, MAX_PAGE_CHARACTERS)}\n\n[Truncated]`
    : markdown;
}
