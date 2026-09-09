import type { SearchRequest } from "@elastic/elasticsearch/lib/api/types";
import { parseQuery } from "./parseQuery";

export interface PersonSearch {
  userIds: string[];
  topic: string;
}

export interface PersonCandidate {
  objectID: string;
  displayName: string;
  slug?: string;
  karma?: number;
}

function words(text: string): string[] {
  return text.toLowerCase().replace(/[-_]/g, " ").match(/[\p{L}\p{N}]+/gu) ?? [];
}

export function compilePersonLookup(search: string): SearchRequest | undefined {
  if (parseQuery(search).isAdvanced) return undefined;
  const tokens = words(search);
  if (!tokens.length || tokens.length > 8) return undefined;
  return {
    index: "users",
    size: 100,
    query: {bool: {
      should: [], filter: [{term: {deleted: false}}, {term: {deleteContent: false}}],
      must: [{bool: {minimum_should_match: 1, should: [
        {term: {"displayName.sort": {value: search.trim(), case_insensitive: true, boost: 100}}},
        {term: {"slug.sort": {value: search.trim(), case_insensitive: true, boost: 100}}},
        {match: {"displayName.exact": {query: tokens.join(" "), operator: "or", fuzziness: 0}}},
      ]}}],
    }},
    sort: [{_score: {order: "desc"}}, {karma: "desc"}, {objectID: "asc"}],
    _source: ["objectID", "displayName", "slug", "karma"],
  };
}

/** Exact names, or a prominent author's complete first name, never fuzzy substrings. */
export function resolvePersonSearch(search: string, candidates: PersonCandidate[]): PersonSearch | undefined {
  if (parseQuery(search).isAdvanced) return undefined;
  const tokens = words(search);
  let bestLength = 0;
  let bestStart = 0;
  const userIds: string[] = [];
  for (const candidate of candidates) {
    const name = words(candidate.displayName);
    const alternatives = [name, ...(candidate.slug ? [words(candidate.slug)] : [])];
    if (name.length > 1 && name[0].length >= 4 && (candidate.karma ?? 0) >= 1000) alternatives.push([name[0]]);
    for (const alternative of alternatives) {
      if (!alternative.length) continue;
      for (let start = 0; start <= tokens.length - alternative.length; start++) {
        if (!alternative.every((word, index) => word === tokens[start + index])) continue;
        if (alternative.length < bestLength) continue;
        if (alternative.length > bestLength) {
          bestLength = alternative.length;
          bestStart = start;
          userIds.length = 0;
        }
        // Ambiguous matches to the same span are retained, rather than choosing one author.
        if (start === bestStart && !userIds.includes(candidate.objectID)) userIds.push(candidate.objectID);
      }
    }
  }
  if (!userIds.length) return undefined;
  return {userIds, topic: [...tokens.slice(0, bestStart), ...tokens.slice(bestStart + bestLength)].join(" ")};
}
