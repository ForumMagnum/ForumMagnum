import uniqBy from "lodash/uniqBy";
import { userMentionQueryString } from "@/lib/pingback";
import { getAvailableLlms, getLatestLlmVersion, LLM_FAMILIES, type LlmFamily, type LlmFamilyVersion, type LlmVersion } from "@/lib/languageModels/llmRegistry";

export const LLM_MENTION_VERSION_QUERY = "model";

export function getMentionedLlmVersion(family: LlmFamily, versionName: string | null): LlmVersion | undefined {
  if (!versionName) {
    return getLatestLlmVersion(family);
  }
  return family.versions.find((version) => version.name === versionName && !version.retired);
}

export function getMentionableLlms(query: string): LlmFamilyVersion[] {
  const normalizedQuery = query.toLowerCase();
  const latestOfMatchingFamilies = LLM_FAMILIES
    .filter((family) => nameMatchesQuery(family.name, normalizedQuery))
    .flatMap((family) => {
      const version = getLatestLlmVersion(family);
      return version ? [{ family, version }] : [];
    });
  const matchingVersions = getAvailableLlms()
    .filter(({ version }) => nameMatchesQuery(version.name, normalizedQuery) || nameMatchesQuery(version.fullName, normalizedQuery));
  return uniqBy([...latestOfMatchingFamilies, ...matchingVersions], ({ version }) => version.name);
}

function nameMatchesQuery(name: string, normalizedQuery: string): boolean {
  const normalizedName = name.toLowerCase();
  return normalizedName.startsWith(normalizedQuery)
    || normalizedName.split(/[\s-]+/).some((word) => word.startsWith(normalizedQuery));
}

export function getLlmMentionPath({ family, version }: LlmFamilyVersion): string {
  return `/users/${family.accountSlug}?${userMentionQueryString}&${LLM_MENTION_VERSION_QUERY}=${encodeURIComponent(version.name)}`;
}
