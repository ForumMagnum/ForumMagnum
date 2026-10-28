import type { ForumTypeString } from "@/lib/instanceSettings";
import { userMentionQuery, userMentionQueryString, userMentionValue } from "@/lib/pingback";
import { classifyHost } from "@/lib/routeUtil";
import { getSiteUrl } from "@/lib/vulcan-lib/utils";
import { getLlmFamilyBySlug, type LlmFamilyVersion } from "@/lib/languageModels/llmRegistry";
import { getMentionedLlmVersion, LLM_MENTION_VERSION_QUERY, llmMentionsEnabledSetting } from "@/lib/llmReplies/llmMentions";
import { extractLinks } from "@/server/pingbacks";

const USER_PAGE_PATH = /^\/users\/([^/]+)\/?$/;

export function getFirstMentionedLlm(html: string, forumType: ForumTypeString): LlmFamilyVersion | null {
  if (!llmMentionsEnabledSetting.get(forumType) || !html.includes(userMentionQueryString)) {
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
  if (!family) {
    return null;
  }
  const version = getMentionedLlmVersion(family, url.searchParams.get(LLM_MENTION_VERSION_QUERY));
  return version ? { family, version } : null;
}
