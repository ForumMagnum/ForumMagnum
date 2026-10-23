import type { ForumTypeString } from "@/lib/instanceSettings";
import { userMentionQuery, userMentionQueryString, userMentionValue } from "@/lib/pingback";
import { classifyHost } from "@/lib/routeUtil";
import { getSiteUrl } from "@/lib/vulcan-lib/utils";
import { getLlmFamilyBySlug, type LlmFamilyVersion } from "@/lib/languageModels/llmRegistry";
import { getMentionedLlmVersion, LLM_MENTION_VERSION_QUERY } from "@/lib/llmReplies/llmMentions";
import { extractLinks } from "@/server/pingbacks";

const USER_PAGE_PATH = /^\/users\/([^/]+)\/?$/;

/**
 * The first model version mentioned in a comment's HTML. Only the first
 * replies, so later model mentions are ignored. A mention without a version
 * summons the family's latest; a mention of a retired version summons
 * nothing.
 */
export function getFirstMentionedLlm(html: string, forumType: ForumTypeString): LlmFamilyVersion | null {
  // Most comments mention no one, so skip parsing them
  if (!html.includes(userMentionQueryString)) {
    return null;
  }
  for (const link of extractLinks(html)) {
    const mentionedLlm = getMentionedLlm(link, forumType);
    if (mentionedLlm) {
      return mentionedLlm;
    }
  }
  return null;
}

function getMentionedLlm(link: string, forumType: ForumTypeString): LlmFamilyVersion | null {
  const siteUrl = new URL(getSiteUrl(forumType));
  let url: URL;
  try {
    url = new URL(link, siteUrl);
  } catch {
    return null;
  }
  // classifyHost's domain list doesn't include dev or staging hosts, so also
  // accept links to the site we're running as
  const isOnsite = url.host === siteUrl.host || classifyHost(url.host) !== "offsite";
  if (!isOnsite || url.searchParams.get(userMentionQuery) !== userMentionValue) {
    return null;
  }
  const accountSlug = url.pathname.match(USER_PAGE_PATH)?.[1];
  const family = accountSlug ? getLlmFamilyBySlug(accountSlug) : undefined;
  const version = family && getMentionedLlmVersion(family, url.searchParams.get(LLM_MENTION_VERSION_QUERY));
  return family && version ? { family, version } : null;
}
