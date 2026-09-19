import type { SearchRequest, QueryDslQueryContainer } from "@elastic/elasticsearch/lib/api/types";
import { parseQuery } from "./parseQuery";

export type PersonConfidence = "exact" | "strong" | "weak";

export interface PersonSearch {
  userIds: string[];
  topic: string;
  confidence: PersonConfidence;
  candidates?: ResolvedPersonCandidate[];
}

export interface ResolvedPersonCandidate {
  userId: string;
  confidence: PersonConfidence;
}

export interface PersonCandidate {
  objectID: string;
  displayName: string;
  slug?: string;
  karma?: number;
  fullName?: string | null;
}

interface SpanMatch {
  start: number;
  length: number;
  confidence: PersonConfidence;
}

const prominentKarma = 1000;
const confidenceRank: Record<PersonConfidence, number> = {exact: 3, strong: 2, weak: 1};

function words(text: string): string[] {
  return text.toLowerCase().replace(/[-_]/g, " ").match(/[\p{L}\p{N}]+/gu) ?? [];
}

function editDistance(a: string, b: string): number {
  const previous = Array.from({length: b.length + 1}, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = previous[j];
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return previous[b.length];
}

function fuzzyWordMatch(token: string, word: string, exactNeighbours: boolean): boolean {
  if (token === word) return true;
  if (token.length < 4 || (token.length < 5 && !exactNeighbours)) return false;
  const allowed = token.length >= 8 ? 2 : 1;
  return editDistance(token, word) <= allowed;
}

function exactSpans(tokens: string[], alternative: string[], confidence: PersonConfidence): SpanMatch[] {
  const spans: SpanMatch[] = [];
  if (!alternative.length) return spans;
  for (let start = 0; start <= tokens.length - alternative.length; start++) {
    if (alternative.every((word, index) => word === tokens[start + index])) {
      spans.push({start, length: alternative.length, confidence});
    }
  }
  return spans;
}

function fuzzySpans(tokens: string[], name: string[]): SpanMatch[] {
  const spans: SpanMatch[] = [];
  if (!name.length) return spans;
  for (let start = 0; start <= tokens.length - name.length; start++) {
    const span = tokens.slice(start, start + name.length);
    const exactCount = span.filter((token, index) => token === name[index]).length;
    if (exactCount === name.length) continue;
    const matched = span.every((token, index) => {
      const word = name[index];
      const trailingPrefix = name.length > 1 && index === name.length - 1 && token.length >= 3 && word.startsWith(token);
      return trailingPrefix || fuzzyWordMatch(token, word, exactCount > 0);
    });
    if (matched) spans.push({start, length: name.length, confidence: "weak"});
  }
  return spans;
}

function prefixSpans(tokens: string[], candidate: PersonCandidate): SpanMatch[] {
  const targets = [words(candidate.displayName).join(""), ...(candidate.slug ? [words(candidate.slug).join("")] : [])];
  const spans: SpanMatch[] = [];
  tokens.forEach((token, start) => {
    if (token.length >= 4 && targets.some(target => target.length > token.length && target.startsWith(token))) {
      spans.push({start, length: 1, confidence: "weak"});
    }
  });
  return spans;
}

function compactPrefixMatch(query: string, name: string): boolean {
  if (query.length < 4 || query.slice(0, 4) !== name.slice(0, 4)) return false;
  if (name.startsWith(query)) return true;
  for (let skip = 4; skip < query.length; skip++) {
    if ((name.slice(0, skip) + name.slice(skip + 1)).startsWith(query)) return true;
  }
  return false;
}

function candidateSpans(tokens: string[], candidate: PersonCandidate): SpanMatch[] {
  const names = [words(candidate.displayName), ...(candidate.fullName ? [words(candidate.fullName)] : [])];
  const spans = names.flatMap(name => exactSpans(tokens, name, "exact"));
  if (candidate.slug) spans.push(...exactSpans(tokens, words(candidate.slug), "exact"));
  if ((candidate.karma ?? 0) < prominentKarma) return spans;
  for (const name of names) {
    if (name.length > 1 && name[0].length >= 4) spans.push(...exactSpans(tokens, [name[0]], "strong"));
    const surname = name[name.length - 1];
    if (name.length > 1 && surname.length >= 3) spans.push(...exactSpans(tokens, [surname], "weak"));
    spans.push(...fuzzySpans(tokens, name));
  }
  if (candidate.slug) spans.push(...fuzzySpans(tokens, words(candidate.slug)));
  spans.push(...prefixSpans(tokens, candidate));
  const compact = tokens.join("");
  const compactNames = [...names, ...(candidate.slug ? [words(candidate.slug)] : [])];
  if (compactNames.some(name => compactPrefixMatch(compact, name.join("")))) {
    spans.push({start: 0, length: tokens.length, confidence: "weak"});
  }
  return spans;
}

function betterSpan(candidate: SpanMatch, best: SpanMatch | undefined): boolean {
  if (!best) return true;
  if (candidate.length !== best.length) return candidate.length > best.length;
  return confidenceRank[candidate.confidence] > confidenceRank[best.confidence];
}

function sameSpan(a: SpanMatch, b: SpanMatch): boolean {
  return a.start === b.start && a.length === b.length && a.confidence === b.confidence;
}

export function compilePersonLookup(search: string): SearchRequest | undefined {
  if (parseQuery(search).isAdvanced) return undefined;
  const tokens = words(search);
  if (!tokens.length || tokens.length > 8) return undefined;
  const joined = tokens.join(" ");
  const exactValues = new Set([search.trim()]);
  const sourceWords = [...search.matchAll(/[\p{L}\p{N}]+/gu)];
  for (let start = 0; start < tokens.length; start++) {
    for (let end = start + 1; end <= tokens.length; end++) {
      const span = tokens.slice(start, end);
      const lastWord = sourceWords[end - 1];
      exactValues.add(search.slice(sourceWords[start].index, lastWord.index + lastWord[0].length));
      for (const separator of [" ", "_", "-"]) exactValues.add(span.join(separator));
    }
  }
  const exact: QueryDslQueryContainer[] = [...exactValues].flatMap(value => [
    {term: {"displayName.sort": {value, case_insensitive: true, boost: 100}}},
    {term: {"slug.sort": {value, case_insensitive: true, boost: 100}}},
    {term: {"fullName.sort": {value, case_insensitive: true, boost: 100}}},
  ]);
  const anchor = tokens.join("").slice(0, 4);
  const partial: QueryDslQueryContainer[] = [
    ...(anchor.length === 4 ? ["displayName.sort", "slug.sort", "fullName.sort"].map(field => ({
      prefix: {[field]: {value: anchor, case_insensitive: true}},
    })) : []),
    {match: {"displayName.exact": {query: joined, operator: "or", fuzziness: 0, boost: 10}}},
    {match: {"fullName.exact": {query: joined, operator: "or", fuzziness: 0, boost: 10}}},
    {prefix: {"displayName.sort": {value: joined, case_insensitive: true, boost: 5}}},
    ...tokens.filter(token => token.length >= 4).flatMap(token => [
      {prefix: {"slug.sort": {value: token, case_insensitive: true}}},
      {prefix: {"displayName.sort": {value: token, case_insensitive: true}}},
    ]),
    {match: {"displayName.exact": {query: joined, operator: "or", fuzziness: "AUTO", prefix_length: 1}}},
    {match: {"slug.exact": {query: joined, operator: "or", fuzziness: "AUTO", prefix_length: 1}}},
    {match: {"fullName.exact": {query: joined, operator: "or", fuzziness: "AUTO", prefix_length: 1}}},
  ];
  return {
    index: "users",
    size: 100,
    query: {bool: {
      should: [], filter: [{term: {deleted: false}}, {term: {deleteContent: false}}],
      must: [{bool: {minimum_should_match: 1, should: [
        ...exact,
        {bool: {should: partial, minimum_should_match: 1, filter: [{range: {karma: {gte: prominentKarma}}}]}},
      ]}}],
    }},
    sort: [{_score: {order: "desc"}}, {karma: "desc"}, {objectID: "asc"}],
    _source: ["objectID", "displayName", "slug", "karma", "fullName"],
  };
}

export function resolvePersonSearch(search: string, candidates: PersonCandidate[]): PersonSearch | undefined {
  if (parseQuery(search).isAdvanced) return undefined;
  const tokens = words(search);
  let best: SpanMatch | undefined;
  const userIds: string[] = [];
  for (const candidate of candidates) {
    for (const span of candidateSpans(tokens, candidate)) {
      if (betterSpan(span, best)) {
        best = span;
        userIds.length = 0;
      }
      if (best && sameSpan(span, best) && !userIds.includes(candidate.objectID)) userIds.push(candidate.objectID);
    }
  }
  if (!best || !userIds.length) return undefined;
  const resolvedCandidates: ResolvedPersonCandidate[] = [];
  for (const candidate of candidates) {
    const spans = candidateSpans(tokens, candidate).filter(span => span.start === best.start && span.length === best.length);
    let confidence: PersonConfidence | undefined;
    for (const span of spans) {
      if (!confidence || confidenceRank[span.confidence] > confidenceRank[confidence]) confidence = span.confidence;
    }
    if (confidence) resolvedCandidates.push({userId: candidate.objectID, confidence});
  }
  return {
    userIds,
    candidates: resolvedCandidates,
    topic: [...tokens.slice(0, best.start), ...tokens.slice(best.start + best.length)].join(" "),
    confidence: best.confidence,
  };
}
