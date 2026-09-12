import type {
  QueryDslFunctionScoreContainer,
  QueryDslQueryContainer,
  SearchHighlightField,
  SearchRequest,
} from "@elastic/elasticsearch/lib/api/types";
import ElasticQuery, { QueryFilter } from "./ElasticQuery";
import { collectionNameToConfig, indexToCollectionName } from "./ElasticConfig";
import { contentTokens } from "./searchTokens";
import { compileUnifiedSort } from "./ElasticUnifiedSort";
import { parseQuery } from "./parseQuery";
import type { MultiQueryData } from "./unifiedSearchTypes";
import type { PersonConfidence, PersonSearch } from "./ElasticPersonSearch";

/**
 * Additive unified ranking. Every signal is a bounded number of points on one
 * shared scale and the final score is their sum:
 *
 *   score = T (topical match, 0..5) + H (title coverage, 0..1)
 *         + N (navigation) + A (person relationship)
 *         + P_eff (popularity gated by T, 0..4 for content, 0..10 for users) + C (context)
 *
 * Content popularity can overcome modest text differences. User popularity has
 * more weight so established authors remain discoverable through partial handles.
 * Identifier queries retrieve only their target; ordinary navigation is a
 * bounded preference. Original and author-plus-topic interpretations compete by max.
 * See the search README for the full rationale and the calibration procedure.
 */
interface RankingPivots {
  [index: string]: number;
}

export const rankingWeights = {
  match: {
    bm25: 3.0,
    allTerms: 1.0,
    titleAll: 1.0,
    phrase: 1.0,
    max: 6.0,
    topicalMax: 5.0,
    // Saturation pivots for raw BM25. Recalibrate with the ranking evaluation script.
    // Median top-ten raw topical scores, 150 deterministically sampled development
    // training queries, multi-index DFS, 2026-09-10. Recalibrate for another corpus.
    pivots: {posts: 8.1, comments: 7.6, users: 12.9, tags: 5.9, sequences: 3.8} satisfies RankingPivots,
  },
  navigation: {
    identifier: 8.0,
    exactTitle: [0.0, 2.5, 4.5],
  },
  relationship: {
    profile: {exact: 6.0, strong: 5.0, weak: 4.0} satisfies Record<PersonConfidence, number>,
    authored: {exact: 3.0, strong: 3.0, weak: 2.0} satisfies Record<PersonConfidence, number>,
    authoredComment: {exact: 2.0, strong: 2.0, weak: 1.5} satisfies Record<PersonConfidence, number>,
    // Accounts below the prominence threshold can only resolve by exact name. A
    // zero-karma account named "Marx" or "Ryan" is a possible target, not the
    // likely one, so its profile gets this share of the points.
    minorShare: 0.5,
    prominentKarma: 1000,
  },
  popularity: {
    slope: 0.8,
    userSlope: 2.0,
    userCap: 10.0,
    cap: 4.0,
    gateFloor: 0.1,
    // User karma spans much larger totals than content scores; saturation starts
    // at 93,000 rather than 3,100 so established authors remain distinguishable.
    pivots: {posts: 15, comments: 4, tags: 5, sequences: 15, users: 3000} satisfies RankingPivots,
  },
  context: {
    comment: 0.0,
    unresolvedUser: -0.5,
    curated: 0.5,
    event: 1.0,
    // Elasticsearch rejects negative function scores. Every document receives this
    // constant so the offsets above never push a script result below zero.
    baseline: 2.0,
  },
};

/** Exact-title points by query distinctiveness, proxied by content-token count. */
export function navigationPoints(tokenCount: number): number {
  const steps = rankingWeights.navigation.exactTitle;
  if (tokenCount < 1) return 0;
  return steps[Math.min(tokenCount, steps.length) - 1];
}

/** Sigmoid saturation of raw BM25: a median hit (s = k) earns half the points. */
export function matchPoints(bm25: number, pivot: number): number {
  const squared = bm25 * bm25;
  return rankingWeights.match.bm25 * squared / (squared + (pivot * pivot));
}

export function popularityPoints(karma: number, pivot: number, slope = rankingWeights.popularity.slope, cap = rankingWeights.popularity.cap): number {
  return Math.min(cap, slope * Math.log2(1 + (Math.max(karma, 0) / pivot)));
}

export function popularityGate(match: number): number {
  const {gateFloor} = rankingWeights.popularity;
  const normalized = Math.min(Math.max(match, 0), rankingWeights.match.topicalMax) / rankingWeights.match.topicalMax;
  return gateFloor + ((1 - gateFloor) * normalized * normalized);
}

export interface SearchIdentifier {
  objectID?: string;
  slug?: string;
  index?: string;
}

const objectIdPattern = /^([A-Za-z0-9]{17}|[0-9a-f]{24})$/;
const urlRoutes: [RegExp, string, "objectID" | "slug"][] = [
  [/^\/posts\/([A-Za-z0-9]{17}|[0-9a-f]{24})(?:\/|$)/, "posts", "objectID"],
  [/^\/s\/([A-Za-z0-9]{17})(?:\/|$)/, "sequences", "objectID"],
  [/^\/users\/([^/?#]+)/, "users", "slug"],
  [/^\/(?:w|tag|topics)\/([^/?#]+)/, "tags", "slug"],
];

/** Document IDs and internal URLs are navigation, not text. */
export function parseIdentifier(search: string): SearchIdentifier | undefined {
  const trimmed = search.trim();
  // Lowercase alphabetic words can have 17 letters (e.g. malformed technical
  // terms). Keep those on the text path; URLs still identify any valid ID.
  if (objectIdPattern.test(trimmed) && (/^[0-9a-f]{24}$/.test(trimmed) || /[A-Z0-9]/.test(trimmed))) return {objectID: trimmed};
  if (!/^https?:\/\//i.test(trimmed) && !/^\/(?!\/)/.test(trimmed)) return undefined;
  let pathname: string;
  try {
    const url = new URL(trimmed, "https://www.lesswrong.com");
    if (!["lesswrong.com", "www.lesswrong.com", "alignmentforum.org", "www.alignmentforum.org"].includes(url.hostname)
        || url.username || url.password) return undefined;
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return undefined;
  }
  for (const [pattern, index, kind] of urlRoutes) {
    const matched = pattern.exec(pathname);
    if (matched) return {[kind]: matched[1], index};
  }
  return undefined;
}

// Inner script: sigmoid-saturated BM25 so that raw scores contribute a bounded
// amount and a passing mention separates from a substantive match (matchPoints).
const matchScript = "params.bm25 * _score * _score / (_score * _score + params.k * params.k)";

// Outer script: `_score` here is topical evidence, before title and relationship bonuses.
const popularityScript = `
  double karma = doc.containsKey(params.karmaField) && doc[params.karmaField].size() > 0
    ? Math.max(0, doc[params.karmaField].value) : 0;
  double cap = (double) params.cap;
  double slope = (double) params.slope;
  double pivot = (double) params.pivot;
  double gateFloor = (double) params.gateFloor;
  double matchMax = (double) params.matchMax;
  double popularity = Math.min(cap, slope * Math.log(1 + karma / pivot) / Math.log(2));
  double normalizedMatch = Math.min(_score, matchMax) / matchMax;
  double gate = gateFloor + (1 - gateFloor) * normalizedMatch * normalizedMatch;
  double context = (double) params.baseline + (double) params.typeOffset;
  double eventWeight = (double) params.eventWeight;
  if (eventWeight > 0 && doc.containsKey('startTime') && doc['startTime'].size() > 0
      && doc.containsKey('isEvent') && doc['isEvent'].size() > 0 && doc['isEvent'].value) {
    double distance = doc['startTime'].value.toInstant().toEpochMilli() - (double) params.now;
    double beyondOffset = Math.max(0, distance - (double) params.eventOffsetMs);
    double scale = (double) params.eventScaleMs;
    double decay = Math.exp(-beyondOffset * beyondOffset * Math.log(2) / (scale * scale));
    if (distance >= 0) context += eventWeight * decay;
  }
  return popularity * gate + context;
`;

const dayMs = 24 * 60 * 60 * 1000;

interface IndexFields {
  /** The stemmed title or name field, when the index has one that matters for ranking. */
  title?: string;
  /** Main body-like field for the phrase feature. */
  body?: string;
  /** Same-analyzer text fields used for the "all terms present" feature. */
  allTermsFields: string[];
  /** Analyzed fields for residual topic matching. */
  topicFields: string[];
}

/**
 * Users are found by name (see userNameRecall) and ranked by person
 * resolution and karma. Bio text is for the people directory, not the header,
 * and literal name matches must not outrank a resolved prominent author.
 * Comments have no title feature: a comment under a matching post is not
 * itself about the query.
 */
function indexFields(index: string): IndexFields {
  const collectionName = indexToCollectionName(index);
  const config = collectionNameToConfig(collectionName);
  const names = config.fields.map(field => field.split("^")[0]);
  const topicFields = names.filter(name => !name.startsWith("author"));
  switch (index) {
    case "posts":
      return {title: "title", body: "body", allTermsFields: ["title", "body"], topicFields};
    case "sequences":
      return {title: "title", body: "plaintextDescription", allTermsFields: ["title", "plaintextDescription"], topicFields};
    case "tags":
      return {title: "name", body: "description", allTermsFields: ["name", "description"], topicFields};
    case "users":
      return {allTermsFields: [], topicFields: ["displayName"]};
    case "comments":
      return {body: "body", allTermsFields: ["body"], topicFields};
    default:
      throw new Error("Invalid index name: " + index);
  }
}

/**
 * Header recall for users: the name as typed (with typos or while typing) or a
 * resolved person. The n-gram name analyzer is for the people directory; in a
 * mixed list it matches unrelated queries through shared letter runs.
 */
function userNameRecall(search: string, minimumShouldMatch: string): QueryDslQueryContainer {
  return {bool: {minimum_should_match: 1, should: [
    {term: {objectID: {value: search}}},
    {match: {"displayName.exact": {query: search, fuzziness: "AUTO", prefix_length: 1, minimum_should_match: minimumShouldMatch}}},
    {match_phrase_prefix: {"displayName.exact": {query: search}}},
  ]}};
}

function karmaField(index: string): string {
  return index === "users" ? "karma" : "baseScore";
}

function residualTopicQuery(index: string, topic: string): QueryDslQueryContainer {
  return {multi_match: {
    query: topic,
    fields: indexFields(index).topicFields,
    minimum_should_match: "2<75%",
  }};
}

function authorshipFilter(index: string, userIds: string[]): QueryDslQueryContainer | undefined {
  if (index === "posts") return {bool: {minimum_should_match: 1, should: [
    {terms: {userId: userIds}}, {terms: {coauthorIds: userIds}},
  ]}};
  if (index === "comments") return {terms: {userId: userIds}};
  if (index === "sequences") return {terms: {collectedAuthorIds: userIds}};
  return undefined;
}

interface RelationshipBranch {
  query: QueryDslQueryContainer;
  weight: number;
}

/**
 * Profile and authorship branches for a resolved person, with their points.
 * Profiles split by prominence: a minor account only ever resolves by its exact
 * name and receives `minorShare` of the points. Authorship cannot see the
 * author's karma on the document, so it keeps the full weight.
 */
function relationshipBranches(index: string, person: PersonSearch): RelationshipBranch[] {
  if (person.candidates) return person.candidates.flatMap(candidate => relationshipBranches(index, {
    userIds: [candidate.userId], topic: person.topic, confidence: candidate.confidence,
  }));
  const {profile, authored, authoredComment, minorShare, prominentKarma} = rankingWeights.relationship;
  const branches: RelationshipBranch[] = [];
  if (index === "users" && !person.topic) {
    const profileIds: QueryDslQueryContainer = {terms: {objectID: person.userIds}};
    branches.push({query: {bool: {should: [], filter: [profileIds, {range: {karma: {gte: prominentKarma}}}]}}, weight: profile[person.confidence]});
    branches.push({query: {bool: {should: [], filter: [profileIds, {range: {karma: {lt: prominentKarma}}}]}}, weight: profile[person.confidence] * minorShare});
  }
  const author = authorshipFilter(index, person.userIds);
  if (author) {
    const query: QueryDslQueryContainer = person.topic
      ? {bool: {should: [], filter: [author], must: [residualTopicQuery(index, person.topic)]}}
      : author;
    const weights = index === "comments" ? authoredComment : authored;
    branches.push({query, weight: weights[person.confidence]});
  }
  return branches;
}

function identifierQuery(index: string, identifier: SearchIdentifier): QueryDslQueryContainer | undefined {
  if (identifier.index && identifier.index !== index) return undefined;
  if (identifier.objectID) return {term: {objectID: {value: identifier.objectID}}};
  if (!identifier.slug) return undefined;
  if (index === "users") return {term: {"slug.sort": {value: identifier.slug, case_insensitive: true}}};
  if (index === "posts" || index === "tags") return {term: {slug: {value: identifier.slug}}};
  return undefined;
}

function hasPhraseWords(search: string): boolean {
  return (search.match(/[\p{L}\p{N}]+/gu)?.length ?? 0) >= 2;
}

function phraseQuery(fields: IndexFields, search: string): QueryDslQueryContainer {
  const phrases: QueryDslQueryContainer[] = [];
  if (fields.title) phrases.push({match_phrase: {[`${fields.title}.exact`]: {query: search, slop: 1}}});
  if (fields.body) phrases.push({match_phrase: {[`${fields.body}.exact`]: {query: search, slop: 2}}});
  return {bool: {should: phrases, minimum_should_match: 1}};
}

/** Bounded recovery for a joined compound, including one typo per part.
 * Adjacent title tokens prevent unrelated words scattered through a body from
 * becoming compound evidence. Short/common tokens and advanced syntax bypass it.
 */
export function compoundTitleQuery(index: string, search: string): QueryDslQueryContainer | undefined {
  const title = indexFields(index).title;
  const token = search.trim().toLowerCase();
  if (!title || !/^[a-z]{12,24}$/.test(token)) return undefined;
  const alternatives: QueryDslQueryContainer[] = [];
  for (let split = 3; split <= token.length - 3; split++) {
    alternatives.push({span_near: {
      clauses: [token.slice(0, split), token.slice(split)].map(part => ({span_multi: {match: {
        fuzzy: {[`${title}.exact`]: {value: part, fuzziness: 1, prefix_length: 2, max_expansions: 5}},
      }}})),
      slop: 0, in_order: true,
    }});
  }
  return {dis_max: {queries: alternatives, tie_breaker: 0}};
}

function matchFunctions(index: string, search: string, tokenCount: number, scoreProximity: boolean): QueryDslFunctionScoreContainer[] {
  const {bm25, allTerms, phrase} = rankingWeights.match;
  const pivots: RankingPivots = rankingWeights.match.pivots;
  const fields = indexFields(index);
  const functions: QueryDslFunctionScoreContainer[] = [
    {script_score: {script: {source: matchScript, params: {bm25, k: pivots[index] ?? 5}}}},
  ];
  if (tokenCount && fields.allTermsFields.length) {
    const coverage: QueryDslQueryContainer = {multi_match: {
      query: search, fields: fields.allTermsFields, type: "cross_fields", operator: "and",
    }};
    const compound = scoreProximity ? compoundTitleQuery(index, search) : undefined;
    functions.push({weight: allTerms, filter: compound
      ? {dis_max: {queries: [coverage, compound], tie_breaker: 0}} : coverage});
  }
  // Stopwords carry useful proximity information: "computation in" is more
  // specific than "computation", even though both have one content token.
  if (scoreProximity && hasPhraseWords(search)) {
    functions.push({weight: phrase, filter: phraseQuery(fields, search)});
  }
  return functions;
}

/** Freshness only answers event discovery intent, never historical/date-filtered searches. */
export function wantsUpcomingEvents(search: string, filters: QueryFilter[]): boolean {
  if (/\b(?:19|20)\d{2}\b/.test(search) || filters.some(filter => /date|time/i.test(filter.field))) return false;
  return /\b(?:meetups?|meetings?|events?|upcoming)\b/i.test(search)
    || filters.some(filter => filter.type === "postType" && filter.value.includes("event"))
    || filters.some(filter => filter.type === "facet" && filter.field === "isEvent" && filter.value === true && !filter.negated);
}

interface BranchInput {
  index: string;
  matchSearch: string;
  tokenCount: number;
  isAdvanced: boolean;
  identifier?: SearchIdentifier;
  person?: PersonSearch;
  recall: QueryDslQueryContainer;
  eligibility: QueryDslQueryContainer[];
  eventIntent: boolean;
}

/** Content-only evidence: no author metadata, field boosts, or relationship scores. */
export function compileTopicalRecall(index: string, search: string, allowCompound = true): QueryDslQueryContainer {
  if (!search) return {match_none: {}};
  if (index === "users") return userNameRecall(search, "2<75%");
  const fields = indexFields(index).allTermsFields;
  const ordinary: QueryDslQueryContainer = {multi_match: {query: search, fields, fuzziness: 1, prefix_length: 2, max_expansions: 10, minimum_should_match: "2<75%"}};
  const compound = allowCompound ? compoundTitleQuery(index, search) : undefined;
  return compound ? {dis_max: {queries: [ordinary, compound], tie_breaker: 0}} : ordinary;
}

function compileInterpretation(input: BranchInput, relationships: RelationshipBranch[]): QueryDslQueryContainer {
  const {index, matchSearch, tokenCount, isAdvanced, identifier, person, recall, eligibility, eventIntent} = input;
  const fields = indexFields(index);
  const {navigation, context, popularity} = rankingWeights;
  const pivots: RankingPivots = popularity.pivots;
  const identity = identifier && identifierQuery(index, identifier);
  const profileIds = person?.candidates?.map(candidate => candidate.userId) ?? person?.userIds ?? [];
  const resolvedProfile: QueryDslQueryContainer | undefined = index === "users" && person && !person.topic
    ? {terms: {objectID: profileIds}} : undefined;

  const outerFunctions: QueryDslFunctionScoreContainer[] = [];
  if (identity) outerFunctions.push({weight: navigation.identifier, filter: identity});
  if (!identity && fields.title && tokenCount && !isAdvanced) {
    const titlePrefix: QueryDslQueryContainer | undefined = hasPhraseWords(matchSearch)
      ? {match_phrase_prefix: {[`${fields.title}.exact`]: {query: matchSearch, max_expansions: 50}}}
      : undefined;
    const titleCoverage: QueryDslQueryContainer = {match: {[fields.title]: {query: matchSearch, operator: "and"}}};
    outerFunctions.push({weight: rankingWeights.match.titleAll * (tokenCount === 1 ? 0.5 : 1), filter: titlePrefix
      ? {bool: {should: [titleCoverage, titlePrefix], minimum_should_match: 1}}
      : titleCoverage});
    const navigationMatches: QueryDslQueryContainer[] = [{
      term: {[`${fields.title}.sort`]: {value: matchSearch.trim(), case_insensitive: true}},
    }];
    if (titlePrefix) {
      // Complete topic phrases such as "lab automation" must not acquire the
      // unfinished-title bonus merely because a title has more words afterward.
      navigationMatches.push({bool: {should: [], filter: [titlePrefix], must_not: [
        {match_phrase: {[`${fields.title}.exact`]: {query: matchSearch, slop: 1}}},
      ]}});
      // Prefix proximity is counted once, after popularity gating. A complete
      // phrase already received the ordinary title/body proximity credit.
      outerFunctions.push({weight: rankingWeights.match.phrase, filter: {bool: {
        should: [], filter: [titlePrefix], must_not: [phraseQuery(fields, matchSearch)],
      }}});
    }
    outerFunctions.push({weight: navigationPoints(tokenCount), filter: {bool: {should: navigationMatches, minimum_should_match: 1}}});
  }
  // Ambiguous coauthors and collections earn the strongest relationship once.
  const relationshipScore: QueryDslQueryContainer | undefined = relationships.length ? {function_score: {
    query: {match_all: {}}, functions: [{weight: 0}, ...relationships.map(branch => ({weight: branch.weight, filter: branch.query}))],
    score_mode: "max", boost_mode: "replace",
  }} : undefined;
  if (index === "posts") outerFunctions.push({weight: context.curated, filter: {term: {curated: true}}});
  const typeOffset = index === "comments" ? context.comment : index === "users" ? context.unresolvedUser : 0;
  const params = {
    karmaField: karmaField(index), pivot: pivots[index], cap: index === "users" ? popularity.userCap : popularity.cap, slope: index === "users" ? popularity.userSlope : popularity.slope,
    gateFloor: popularity.gateFloor, matchMax: rankingWeights.match.topicalMax,
    baseline: context.baseline, typeOffset,
    eventWeight: index === "posts" && eventIntent ? context.event : 0,
    eventScaleMs: 30 * dayMs, eventOffsetMs: 7 * dayMs, now: Date.now(),
  };
  outerFunctions.push({
    ...(resolvedProfile ? {filter: {bool: {should: [], must_not: [resolvedProfile]}}} : {}),
    script_score: {script: {source: popularityScript, params}},
  });
  if (resolvedProfile) outerFunctions.push({filter: resolvedProfile, script_score: {script: {
    source: popularityScript, params: {...params, gateFloor: 1, typeOffset: 0},
  }}});

  // The recall union is a FILTER. Its title/name/relationship clauses cannot
  // increase BM25 or unlock popularity. A zero-score fallback admits recalled
  // documents lacking topical evidence without inventing text points.
  const inner: QueryDslQueryContainer = {function_score: {
    query: {bool: {
      should: [],
      filter: [...eligibility, recall],
      must: [{dis_max: {queries: [compileTopicalRecall(index, matchSearch, !isAdvanced && !identifier), {match_all: {boost: 0}}]}}],
    }},
    functions: matchFunctions(index, matchSearch, isAdvanced ? 0 : tokenCount, !isAdvanced && !identifier),
    score_mode: "sum", boost_mode: "replace",
  }};
  const outer: QueryDslQueryContainer = {function_score: {
    query: inner, functions: outerFunctions, score_mode: "sum", boost_mode: "sum",
  }};
  return relationshipScore ? {bool: {should: [], must: [outer, relationshipScore]}} : outer;
}

function compileIndexBranch(input: BranchInput): QueryDslQueryContainer {
  const {index, person, identifier, recall, eligibility} = input;
  const relationships = person ? relationshipBranches(index, person) : [];
  const identity = identifier && identifierQuery(index, identifier);
  const compound = !input.isAdvanced && !identifier ? compoundTitleQuery(index, input.matchSearch) : undefined;
  const recallUnion: QueryDslQueryContainer = identifier ? identity ?? {match_none: {}} : {bool: {
    should: [recall, ...(compound ? [compound] : []), ...relationships.map(branch => branch.query)], minimum_should_match: 1,
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

export function compileAdditiveMultiQuery({indexes, search, offset = 0, limit = 10, filters = [], preTag, postTag, person, curatedSequenceIds, sort}: MultiQueryData): SearchRequest {
  const highlightFields: Record<string, SearchHighlightField> = {};
  const excludes = new Set<string>();
  const queries: QueryDslQueryContainer[] = [];
  const identifier = parseIdentifier(search);
  // Keep advanced syntax in the established compiler. It must never be
  // reinterpreted as a name, including when callers provide a person directly.
  const isAdvanced = !!search && parseQuery(search).isAdvanced;
  if (isAdvanced || identifier) person = undefined;
  const matchSearch = isAdvanced
    ? parseQuery(search).tokens.filter(token => token.type === "must" || token.type === "should").map(token => token.token).join(" ")
    : search;
  const tokenCount = identifier ? 0 : contentTokens(matchSearch).length;
  for (const index of indexes) {
    const elasticQuery = new ElasticQuery({index, search, filters, preTag, postTag, unifiedRanking: true});
    const request = elasticQuery.compile();
    Object.assign(highlightFields, request.body.highlight?.fields);
    for (const field of request.body._source.excludes) excludes.add(field);
    const recall = elasticQuery.compileAdditiveRecall();
    const recallQuery = index === "users" && search && !isAdvanced
      ? userNameRecall(search, contentTokens(search).length >= 5 ? "60%" : "2<75%")
      : recall.query;
    queries.push(compileIndexBranch({
      index, matchSearch, tokenCount, isAdvanced, identifier, person,
      recall: recallQuery, eligibility: recall.filters ?? [], eventIntent: wantsUpcomingEvents(search, filters),
    }));
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
