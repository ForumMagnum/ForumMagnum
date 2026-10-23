import uniqBy from "lodash/uniqBy";
import { userMentionQueryString } from "@/lib/pingback";
import { getLatestLlmVersion, LLM_FAMILIES, type LlmFamily, type LlmFamilyVersion, type LlmVersion } from "@/lib/languageModels/llmRegistry";

/**
 * A mention of a model is a mention of its family's account whose link also
 * names the version, e.g. `/users/opus?mention=user&model=Opus5.5`. Typing
 * `@Opus` inserts a mention of the latest version.
 */
export const LLM_MENTION_VERSION_QUERY = "model";

/**
 * The version a mention summons: the version it names, or the latest if it
 * doesn't name one. Undefined if the named version is retired or unknown.
 */
export function getMentionedLlmVersion(family: LlmFamily, versionName: string | null): LlmVersion | undefined {
  if (!versionName) {
    return getLatestLlmVersion(family);
  }
  return family.versions.find((version) => version.name === versionName && !version.retired);
}

/**
 * Models to offer when someone types `@<query>`: the latest version of each
 * family matching the query, then any other non-retired version whose name
 * matches it.
 */
export function getMentionableLlms(query: string): LlmFamilyVersion[] {
  const normalizedQuery = query.toLowerCase();
  const latestOfMatchingFamilies = LLM_FAMILIES
    .filter((family) => family.name.toLowerCase().startsWith(normalizedQuery))
    .flatMap((family) => {
      const version = getLatestLlmVersion(family);
      return version ? [{ family, version }] : [];
    });
  const matchingVersions = LLM_FAMILIES.flatMap((family) => family.versions
    .filter((version) => !version.retired && version.name.toLowerCase().startsWith(normalizedQuery))
    .map((version) => ({ family, version })),
  );
  return uniqBy([...latestOfMatchingFamilies, ...matchingVersions], ({ version }) => version.name);
}

/** Where a mention of this version links: the family's account, plus the version */
export function getLlmMentionPath({ family, version }: LlmFamilyVersion): string {
  return `/users/${family.accountSlug}?${userMentionQueryString}&${LLM_MENTION_VERSION_QUERY}=${encodeURIComponent(version.name)}`;
}
