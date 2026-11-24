import type {
  QueryDslQueryContainer,
  SearchHighlightField,
  SearchRequest,
  SortCombinations,
} from "@elastic/elasticsearch/lib/api/types";
import ElasticQuery, { CompiledQuery, QueryFilter, compileAuthorshipQuery } from "./ElasticQuery";
import { IndexConfig, collectionNameToConfig, indexToCollectionName } from "./ElasticConfig";
import { contentTokens, parseQuery } from "./parseQuery";
import type { PersonSearch } from "./ElasticPersonSearch";
import {
  RelationshipBranch,
  SearchIdentifier,
  compoundTitleQuery,
  curatedFunctions,
  identifierQuery,
  identityFunctions,
  matchFunctions,
  parseDocumentUrl,
  parsePastedId,
  popularityFunctions,
  relationshipBranches,
  relationshipScore,
  textFields,
  titleFunctions,
  titlePrefixQuery,
  wantsUpcomingEvents,
} from "./ElasticRankingHeuristics";

export interface SearchQueryData {
  indexes: string[];
  search: string;
  offset?: number;
  limit?: number;
  filters?: QueryFilter[];
  preTag?: string;
  postTag?: string;
  person?: PersonSearch;
}

// Relevance first; date only breaks exact score ties.
const searchSort: SortCombinations[] = [
  {_score: {order: "desc"}},
  {publicDateMs: {order: "desc", missing: "_last", unmapped_type: "long"}},
  {objectID: "asc"},
  {_index: "asc"},
];

function minimumShouldMatch(search: string): string {
  return contentTokens(search).length >= 5 ? "60%" : "2<75%";
}

function textRecall({fields, title}: IndexConfig, search: string): QueryDslQueryContainer {
  const names = fields.map((field) => field.split("^")[0]);
  const main = names[0];
  const should: QueryDslQueryContainer[] = [
    {term: {objectID: {value: search}}},
    {multi_match: {
      query: search,
      fields: names.map(name => name === title ? `${name}^2` : name),
      type: "best_fields",
      fuzziness: 1,
      prefix_length: 2,
      max_expansions: 10,
      minimum_should_match: minimumShouldMatch(search),
    }},
    {multi_match: {
      query: search,
      fields: names.map((name) => `${name}.exact`),
      type: "phrase",
      slop: 2,
    }},
    {match_phrase_prefix: {[`${main}.exact`]: {query: search}}},
  ];
  if (title) should.push({multi_match: {
    query: search, fields: [`${title}^2`], fuzziness: "AUTO", prefix_length: 1,
    max_expansions: 10, minimum_should_match: minimumShouldMatch(search),
  }});
  return {bool: {should, minimum_should_match: 1}};
}

function userNameRecall(search: string, minimumShouldMatch: string): QueryDslQueryContainer {
  return {bool: {minimum_should_match: 1, should: [
    {term: {objectID: {value: search}}},
    {match: {"displayName.exact": {query: search, fuzziness: "AUTO", prefix_length: 1, minimum_should_match: minimumShouldMatch}}},
    {match_phrase_prefix: {"displayName.exact": {query: search}}},
  ]}};
}

function userRecall(config: IndexConfig, search: string): QueryDslQueryContainer {
  const profileFields = config.fields.map(field => field.split("^")[0]).filter(name => name !== "displayName");
  return {bool: {minimum_should_match: 1, should: [
    userNameRecall(search, minimumShouldMatch(search)),
    {multi_match: {query: search, fields: profileFields, minimum_should_match: minimumShouldMatch(search)}},
  ]}};
}

function compileRecall(index: string, config: IndexConfig, search: string): QueryDslQueryContainer {
  if (!search) return {match_all: {}};
  return index === "users" ? userRecall(config, search) : textRecall(config, search);
}

function compileTopicalRecall(index: string, config: IndexConfig, search: string, allowCompound = true): QueryDslQueryContainer {
  if (!search) return {match_none: {}};
  if (index === "users") return userNameRecall(search, "2<75%");
  const ordinary: QueryDslQueryContainer = {multi_match: {query: search, fields: textFields(config), fuzziness: 1, prefix_length: 2, max_expansions: 10, minimum_should_match: "2<75%"}};
  const compound = allowCompound ? compoundTitleQuery(config.title, search) : undefined;
  return compound ? {dis_max: {queries: [ordinary, compound], tie_breaker: 0}} : ordinary;
}

function compileHighlights(
  query: ElasticQuery,
  config: IndexConfig,
  search: string,
  recall: QueryDslQueryContainer,
  advanced?: CompiledQuery,
): Record<string, SearchHighlightField> {
  if (advanced) return query.compileHighlightFields(advanced, recall);
  // User recall queries names on displayName.exact, and require_field_match means
  // highlighting has to use the field the query actually targets.
  const highlights = search
    ? Object.fromEntries((config.highlight ?? []).map(name => [name === "displayName" ? `${name}.exact` : name, recall]))
    : undefined;
  return query.compileHighlightFields({snippetName: config.snippet, highlights}, recall);
}

interface BranchInput {
  index: string;
  config: IndexConfig;
  matchSearch: string;
  tokenCount: number;
  isAdvanced: boolean;
  identifier?: SearchIdentifier;
  pastedId?: string;
  person?: PersonSearch;
  recall: QueryDslQueryContainer;
  eligibility: QueryDslQueryContainer[];
  eventIntent: boolean;
}

function compileInterpretation(input: BranchInput, relationships: RelationshipBranch[]): QueryDslQueryContainer {
  const {index, config, matchSearch, tokenCount, isAdvanced, identifier, pastedId, person, recall, eligibility, eventIntent} = input;
  const identity = identifier && identifierQuery(index, identifier);
  const outerFunctions = [
    ...identityFunctions(identity, pastedId),
    ...(!identity && tokenCount && !isAdvanced ? titleFunctions(index, config, matchSearch, tokenCount) : []),
    ...curatedFunctions(index),
    ...popularityFunctions({
      index, title: config.title, search: matchSearch, person, eventIntent,
      titleWord: tokenCount === 1 && !isAdvanced && !identity,
    }),
  ];

  // The recall union is a FILTER. Its title/name/relationship clauses cannot
  // increase BM25 or unlock popularity. A zero-score fallback admits recalled
  // documents lacking topical evidence without inventing text points.
  const inner: QueryDslQueryContainer = {function_score: {
    query: {bool: {
      should: [],
      filter: [...eligibility, recall],
      must: [{dis_max: {queries: [compileTopicalRecall(index, config, matchSearch, !isAdvanced && !identifier), {match_all: {boost: 0}}]}}],
    }},
    functions: matchFunctions(index, config, matchSearch, isAdvanced ? 0 : tokenCount, !isAdvanced && !identifier),
    score_mode: "sum", boost_mode: "replace",
  }};
  const outer: QueryDslQueryContainer = {function_score: {
    query: inner, functions: outerFunctions, score_mode: "sum", boost_mode: "sum",
  }};
  return relationships.length ? {bool: {should: [], must: [outer, relationshipScore(relationships)]}} : outer;
}

function compileIndexBranch(input: BranchInput): QueryDslQueryContainer {
  const {index, config, person, identifier, recall, eligibility} = input;
  const relationships = person ? relationshipBranches(index, config, person) : [];
  const identity = identifier && identifierQuery(index, identifier);
  const compound = !input.isAdvanced && !identifier ? compoundTitleQuery(config.title, input.matchSearch) : undefined;
  const titlePrefix = !input.isAdvanced && !identifier ? titlePrefixQuery(config.title, input.matchSearch) : undefined;
  const recallUnion: QueryDslQueryContainer = identifier ? identity ?? {match_none: {}} : {bool: {
    should: [recall, ...(compound ? [compound] : []), ...(titlePrefix ? [titlePrefix] : []), ...relationships.map(branch => branch.query)], minimum_should_match: 1,
  }};
  const interpretations = [compileInterpretation({...input, recall: recallUnion}, person?.topic ? [] : relationships)];
  if (person?.topic && relationships.length) {
    interpretations.push(compileInterpretation({
      ...input, matchSearch: person.topic, tokenCount: contentTokens(person.topic).length,
      recall: {bool: {should: relationships.map(branch => branch.query), minimum_should_match: 1}},
    }, relationships));
  }
  return {bool: {should: [], filter: [{term: {_index: index}}, ...eligibility], must: [{dis_max: {queries: interpretations, tie_breaker: 0}}]}};
}

export function personSearchApplies({indexes, search: rawSearch}: SearchQueryData): boolean {
  const search = rawSearch.trim();
  if (!search || parseQuery(search).isAdvanced || parseDocumentUrl(search)) return false;
  return indexes.some(index => index === "users" || !!compileAuthorshipQuery(indexToCollectionName(index), []));
}

export function compileSearchQuery(queryData: SearchQueryData): SearchRequest {
  const {indexes, search: rawSearch, offset = 0, limit = 10, filters = [], preTag, postTag} = queryData;
  const person = personSearchApplies(queryData) ? queryData.person : undefined;
  const highlightFields: Record<string, SearchHighlightField> = {};
  const excludes = new Set<string>();
  const queries: QueryDslQueryContainer[] = [];
  const search = rawSearch.trim();
  const identifier = parseDocumentUrl(search);
  const pastedId = parsePastedId(search);
  const {isAdvanced, tokens} = parseQuery(search);
  const matchSearch = isAdvanced
    ? tokens.filter(token => token.type === "must" || token.type === "should").map(token => token.token).join(" ")
    : search;
  const tokenCount = identifier ? 0 : contentTokens(matchSearch).length;
  const eventIntent = wantsUpcomingEvents(search, filters);
  for (const index of indexes) {
    const config = collectionNameToConfig(indexToCollectionName(index));
    const elasticQuery = new ElasticQuery({index, search, filters, preTag, postTag});
    for (const field of elasticQuery.getSourceExcludes()) excludes.add(field);
    const advanced = isAdvanced ? elasticQuery.compileAdvancedQuery(tokens, true) : undefined;
    const recall = advanced?.searchQuery ?? compileRecall(index, config, search);
    for (const [name, highlight] of Object.entries(compileHighlights(elasticQuery, config, search, recall, advanced))) {
      const highlightQuery = highlight.highlight_query;
      const previous = highlightFields[name]?.highlight_query;
      highlightFields[name] = {
        ...highlight,
        highlight_query: previous && highlightQuery
          ? {bool: {should: [previous, highlightQuery], minimum_should_match: 1}}
          : highlightQuery,
      };
    }
    queries.push(compileIndexBranch({
      index, config, matchSearch, tokenCount, isAdvanced, identifier, pastedId, person,
      recall, eligibility: elasticQuery.compileFilters(tokens) ?? [], eventIntent,
    }));
  }
  return {
    index: indexes,
    search_type: "dfs_query_then_fetch",
    from: offset,
    size: limit,
    track_total_hits: true,
    query: {dis_max: {queries}},
    sort: searchSort,
    highlight: {fields: highlightFields, number_of_fragments: 1, fragment_size: 140, no_match_size: 140},
    _source: {excludes: [...excludes]},
  };
}
