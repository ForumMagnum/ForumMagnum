import uniqBy from "lodash/uniqBy";
import { userMentionQueryString } from "@/lib/pingback";
import { getLatestLlmVersion, LLM_FAMILIES, type LlmFamily, type LlmFamilyVersion, type LlmVersion } from "@/lib/languageModels/llmRegistry";

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

export function getLlmMentionPath({ family, version }: LlmFamilyVersion): string {
  return `/users/${family.accountSlug}?${userMentionQueryString}&${LLM_MENTION_VERSION_QUERY}=${encodeURIComponent(version.name)}`;
}
