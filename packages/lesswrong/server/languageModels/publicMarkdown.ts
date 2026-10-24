import { siteUrlSetting, type ForumTypeString } from "@/lib/instanceSettings";
import { getMarkdownPathname } from "@/lib/routeChecks/markdownVersionRoutes";
import { combineUrls } from "@/lib/vulcan-lib/utils";

const MAX_PAGE_CHARACTERS = 60_000;
const LESSWRONG_HOSTNAME = "lesswrong.com";

export function getPublicMarkdownPath(urlOrPath: string, forumType: ForumTypeString): string | null {
  const siteUrl = new URL(siteUrlSetting.get(forumType));
  let url: URL;
  try {
    url = new URL(urlOrPath, siteUrl);
  } catch {
    return null;
  }
  const isLessWrongHostname = url.hostname === LESSWRONG_HOSTNAME || url.hostname.endsWith(`.${LESSWRONG_HOSTNAME}`);
  if (url.hostname !== siteUrl.hostname && !isLessWrongHostname) {
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

export async function fetchPublicMarkdown(markdownPath: string, forumType: ForumTypeString): Promise<string> {
  const response = await fetch(combineUrls(siteUrlSetting.get(forumType), markdownPath), {
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
