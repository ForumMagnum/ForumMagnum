import type { SearchRequest, SearchHighlightField, QueryDslQueryContainer } from "@elastic/elasticsearch/lib/api/types";
import ElasticQuery from "./ElasticQuery";
import { indexNameToConfig } from "./ElasticConfig";
import { parseQuery } from "./parseQuery";
import { compileAdditiveMultiQuery } from "./ElasticAdditiveRanking";
import { compileUnifiedSort } from "./ElasticUnifiedSort";
import type { MultiQueryData, UnifiedRanking } from "./unifiedSearchTypes";

/** Ranking used when a caller does not choose. Switch after the evaluation in the README. */
export const defaultUnifiedRanking: UnifiedRanking = "tiered";

// Tier intervals never overlap: text relevance and karma only reorder within a tier.
// Saturating the product preserves meaningful karma differences without allowing
// a popular passing mention to outrank an exact title or an authorship match.
const unifiedScoreScript = `
  double karma = doc.containsKey(params.karmaField) && doc[params.karmaField].size() > 0
    ? Math.max(0, doc[params.karmaField].value) : 0;
  double quality = 1 + 3 * karma / (karma + params.pivot);
  double relevance = params.nameOnly ? 1 : _score;
  double weighted = relevance * quality;
  return params.tier * 10 + weighted / (1 + weighted);
`;

function ranked(query: QueryDslQueryContainer, index: string, tier: number, nameOnly = false): QueryDslQueryContainer {
  return {script_score: {query, script: {source: unifiedScoreScript, params: {
    tier, nameOnly, karmaField: index === "users" ? "karma" : "baseScore",
    pivot: index === "users" ? 1000 : index === "comments" ? 10 : 50,
  }}}};
}

function titleQuery(index: string, search: string, exact: boolean): QueryDslQueryContainer | undefined {
  const field = index === "users" ? "displayName" : index === "tags" ? "name" : index === "comments" ? undefined : "title";
  if (!field || !search.trim()) return undefined;
  return exact
    ? {term: {[`${field}.sort`]: {value: search.trim(), case_insensitive: true}}}
    : {match: {[`${field}.exact`]: {query: search, operator: "and", fuzziness: 0}}};
}

function authorship(index: string, userIds: string[]): QueryDslQueryContainer | undefined {
  if (index === "posts") return {bool: {minimum_should_match: 1, should: [
    {terms: {userId: userIds}}, {terms: {coauthorIds: userIds}},
  ]}};
  if (index === "comments") return {terms: {userId: userIds}};
  if (index === "sequences") return {terms: {collectedAuthorIds: userIds}};
  return undefined;
}

export function compileMultiQuery(data: MultiQueryData): SearchRequest {
  if ((data.ranking ?? defaultUnifiedRanking) === "additive") return compileAdditiveMultiQuery(data);
  return compileTieredMultiQuery(data);
}

// Tiered ranking: relationship tiers never overlap; text and karma reorder within a tier.
function compileTieredMultiQuery({indexes, search, offset = 0, limit = 10, filters = [], preTag, postTag, person, featuredSequenceIds = [], curatedSequenceIds, sort}: MultiQueryData): SearchRequest {
  const highlightFields: Record<string, SearchHighlightField> = {};
  const queries: QueryDslQueryContainer[] = [];
  const excludes = new Set<string>();
  const parsed = parseQuery(search);
  // Keep advanced syntax in the established compiler. It must never be stripped
  // or reinterpreted as a name (including when callers provide a person directly).
  if (parsed.isAdvanced) person = undefined;
  const titleSearch = parsed.isAdvanced
    ? parsed.tokens.filter(token => token.type === "must" || token.type === "should").map(token => token.token).join(" ")
    : search;
  for (const index of indexes) {
    const request = new ElasticQuery({index, search, filters, preTag, postTag, unifiedRanking: true}).compile();
    Object.assign(highlightFields, request.body.highlight?.fields);
    for (const field of request.body._source.excludes) excludes.add(field);
    const eligibility = request.body.query.script_score.query.bool.filter ?? [];
    const residualQuery: QueryDslQueryContainer | undefined = person?.topic ? {multi_match: {
      query: person.topic,
      fields: indexNameToConfig(index).fields.filter(field => !field.startsWith("author")).map(field => field.split("^")[0]),
      operator: "and", fuzziness: 0,
    }} : undefined;
    const textQuery = residualQuery ? {bool: {should: [], must: [request.body.query.script_score.query, residualQuery]}} : request.body.query.script_score.query;
    const perIndex: QueryDslQueryContainer[] = [ranked(textQuery, index, index === "comments" ? 1 : index === "users" ? 0 : 2)];
    for (const exact of [false, true]) {
      const title = titleQuery(index, titleSearch, exact);
      if (title) perIndex.push(ranked({bool: {should: [], must: [textQuery, title]}}, index, exact ? 5 : 4));
    }
    if (person) {
      if (index === "users" && !person.topic) {
        perIndex.push(ranked({bool: {should: [], filter: [...eligibility, {terms: {objectID: person.userIds}}]}}, index, 9, true));
      }
      const author = authorship(index, person.userIds);
      if (author) {
        const topicQuery = residualQuery ?? {match_all: {}};
        const related: QueryDslQueryContainer = {bool: {should: [], filter: [...eligibility, author], must: [topicQuery]}};
        perIndex.push(ranked(related, index, index === "comments" ? 3 : 7, !person.topic));
        if (index === "sequences" && featuredSequenceIds.length) {
          perIndex.push(ranked({bool: {should: [], must: [related], filter: [{terms: {objectID: featuredSequenceIds}}]}}, index, 8, !person.topic));
        }
      }
    }
    queries.push({bool: {should: [], filter: [{term: {_index: index}}], must: [{dis_max: {queries: perIndex}}]}});
  }
  return {
    index: indexes,
    search_type: "dfs_query_then_fetch",
    from: offset,
    size: limit,
    track_total_hits: true,
    query: {dis_max: {queries}},
    sort: compileUnifiedSort(sort, indexes.length === 1 && indexes[0] === "sequences" ? curatedSequenceIds : undefined),
    highlight: {fields: highlightFields, number_of_fragments: 1, fragment_size: 140, no_match_size: 140},
    _source: {excludes: [...excludes]},
  };
}
