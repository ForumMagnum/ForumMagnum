import type {
  QueryDslFunctionScoreContainer,
  QueryDslQueryContainer,
} from "@elastic/elasticsearch/lib/api/types";
import { IndexConfig, indexToCollectionName } from "./ElasticConfig";
import { compileAuthorshipQuery, QueryFilter } from "./ElasticQuery";
import type { PersonConfidence, PersonSearch } from "./ElasticPersonSearch";
import groupBy from "lodash/groupBy";

interface RankingPivots {
  [index: string]: number;
}

const rankingWeights = {
  match: {
    bm25: 3.0,
    allTerms: 1.0,
    titleAll: 1.0,
    phrase: 1.0,
    topicalMax: 5.0,
    pivots: {posts: 8.1, comments: 7.6, users: 12.9, tags: 5.9, sequences: 3.8} satisfies RankingPivots,
  },
  navigation: {
    identifier: 8.0,
    exactTitle: [0.0, 2.5, 4.5],
    // A wiki/tag page named by a one-word query is the concept's canonical entry
    // point, unlike a post that happens to have a generic one-word title.
    conceptName: 3.0,
    conceptLead: 1.5,
    conceptWord: 1.0,
  },
  relationship: {
    // An exact handle must outrank posts that merely mention it in their title.
    profile: {exact: 8.0, strong: 6.0, weak: 4.0, prefix: 3.0} satisfies Record<PersonConfidence, number>,
    authored: {exact: 3.0, strong: 3.0, weak: 2.0, prefix: 1.0} satisfies Record<PersonConfidence, number>,
    authoredComment: {exact: 2.0, strong: 2.0, weak: 1.5, prefix: 0.5} satisfies Record<PersonConfidence, number>,
    minorShare: 0.5,
    // Profiles below this get the minor share: inactive namesakes, not active members.
    minorProfileKarma: 100,
  },
  popularity: {
    slope: 0.8,
    userSlope: 2.0,
    userCap: 10.0,
    cap: 4.0,
    gateFloor: 0.1,
    // A one-word query in, or starting a word of, the title opens the popularity
    // gate to at least this much, so popular titled posts beat passing body
    // mentions. It adds nothing for an unpopular title, so generic exact titles
    // still have no unconditional priority.
    titleGate: 1.0,
    pivots: {posts: 15, comments: 4, tags: 5, sequences: 15, users: 3000} satisfies RankingPivots,
  },
  context: {
    typeOffsets: {comments: 0.0, users: -0.5} satisfies RankingPivots,
    curated: 0.5,
    event: 1.0,
    // Elasticsearch rejects negative function scores. Every document receives this
    // constant so the offsets above never push a script result below zero.
    baseline: 2.0,
  },
};

function navigationPoints(tokenCount: number): number {
  const steps = rankingWeights.navigation.exactTitle;
  if (tokenCount < 1) return 0;
  return steps[Math.min(tokenCount, steps.length) - 1];
}

export interface SearchIdentifier {
  objectID?: string;
  slug?: string;
  index: string;
  commentId?: string;
}

const documentId = "([A-Za-z0-9]{17}|[0-9a-f]{24})";
const documentIdPattern = new RegExp(`^${documentId}$`);
const commentRoute = new RegExp(`^/posts/[^/]+/[^/]+/comment/${documentId}(?:/|$)`);
const urlRoutes: [RegExp, string, "objectID" | "slug"][] = [
  [new RegExp(`^/(?:posts|events)/${documentId}(?:/|$)`), "posts", "objectID"],
  [new RegExp(`^/(?:s|g)/[^/]+/p/${documentId}(?:/|$)`), "posts", "objectID"],
  [new RegExp(`^/(?:s|sequences)/${documentId}(?:/|$)`), "sequences", "objectID"],
  [/^\/users\/([^/?#]+)/, "users", "slug"],
  [/^\/(?:w|tag|topics)\/([^/?#]+)/, "tags", "slug"],
];

export function parseDocumentUrl(search: string): SearchIdentifier | undefined {
  const trimmed = search.trim();
  if (!/^https?:\/\//i.test(trimmed) && !/^\/(?!\/)/.test(trimmed)) return undefined;
  let url: URL;
  let pathname: string;
  try {
    url = new URL(trimmed, "https://www.lesswrong.com");
    if (!["lesswrong.com", "www.lesswrong.com", "alignmentforum.org", "www.alignmentforum.org"].includes(url.hostname)
        || url.username || url.password) return undefined;
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return undefined;
  }
  const commentId = [commentRoute.exec(pathname)?.[1], url.searchParams.get("commentId"), url.hash.slice(1)].find(id => id && documentIdPattern.test(id));
  for (const [pattern, index, kind] of urlRoutes) {
    const matched = pattern.exec(pathname);
    if (matched) return {[kind]: matched[1], index, ...(commentId ? {commentId} : {})};
  }
  return undefined;
}

export function parsePastedId(search: string): string | undefined {
  return documentIdPattern.test(search) ? search : undefined;
}

export function identifierQuery(index: string, identifier: SearchIdentifier): QueryDslQueryContainer | undefined {
  if (index === "comments" && identifier.commentId) return {term: {objectID: {value: identifier.commentId}}};
  if (identifier.index !== index) return undefined;
  if (identifier.objectID) return {term: {objectID: {value: identifier.objectID}}};
  if (!identifier.slug) return undefined;
  if (index === "users") return {term: {"slug.sort": {value: identifier.slug, case_insensitive: true}}};
  if (index === "posts" || index === "tags") return {term: {slug: {value: identifier.slug}}};
  return undefined;
}

export function identityFunctions(identity: QueryDslQueryContainer | undefined, pastedId: string | undefined): QueryDslFunctionScoreContainer[] {
  const {identifier} = rankingWeights.navigation;
  return [
    ...(identity ? [{weight: identifier, filter: identity}] : []),
    ...(pastedId ? [{weight: identifier, filter: {term: {objectID: {value: pastedId}}}}] : []),
  ];
}

const matchScript = "params.bm25 * _score * _score / (_score * _score + params.k * params.k)";

/** Popularity grows with the log of karma, and the gate opens it with the square of the text match */
const popularityGate = `
  double karma = doc.containsKey(params.karmaField) && doc[params.karmaField].size() > 0
    ? Math.max(0, doc[params.karmaField].value) : 0;
  double popularity = Math.min((double) params.cap, (double) params.slope * Math.log(1 + karma / (double) params.pivot) / Math.log(2));
  double normalizedMatch = Math.min(_score, (double) params.matchMax) / (double) params.matchMax;
  double gate = (double) params.gateFloor + (1 - (double) params.gateFloor) * normalizedMatch * normalizedMatch;
`;

const popularityScript = `${popularityGate}
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

const titleGateScript = `${popularityGate}
  return popularity * Math.max(0, (double) params.titleGate - gate);
`;

const dayMs = 24 * 60 * 60 * 1000;

function karmaField(index: string): string {
  return index === "users" ? "karma" : "baseScore";
}

export function textFields({title, body}: IndexConfig): string[] {
  return [title, body].filter((field): field is string => !!field);
}

function residualTopicQuery(config: IndexConfig, topic: string): QueryDslQueryContainer {
  return {multi_match: {
    query: topic,
    fields: config.fields.map(field => field.split("^")[0]).filter(name => !name.startsWith("author")),
    minimum_should_match: "2<75%",
  }};
}

export interface RelationshipBranch {
  query: QueryDslQueryContainer;
  weight: number;
}

/** One set of branches per confidence, so the query's size doesn't grow with the number of candidates */
export function relationshipBranches(index: string, config: IndexConfig, {topic, candidates}: PersonSearch): RelationshipBranch[] {
  const {profile, authored, authoredComment, minorShare, minorProfileKarma} = rankingWeights.relationship;
  return Object.values(groupBy(candidates, candidate => candidate.confidence)).flatMap(group => {
    const userIds = group.map(candidate => candidate.userId);
    const {confidence} = group[0];
    const branches: RelationshipBranch[] = [];
    if (index === "users" && !topic) {
      const profileIds: QueryDslQueryContainer = {terms: {objectID: userIds}};
      branches.push({query: {bool: {should: [], filter: [profileIds, {range: {karma: {gte: minorProfileKarma}}}]}}, weight: profile[confidence]});
      branches.push({query: {bool: {should: [], filter: [profileIds, {range: {karma: {lt: minorProfileKarma}}}]}}, weight: profile[confidence] * minorShare});
    }
    const author = compileAuthorshipQuery(indexToCollectionName(index), userIds);
    if (author) {
      const query: QueryDslQueryContainer = topic
        ? {bool: {should: [], filter: [author], must: [residualTopicQuery(config, topic)]}}
        : author;
      branches.push({query, weight: (index === "comments" ? authoredComment : authored)[confidence]});
    }
    return branches;
  });
}

export function relationshipScore(relationships: RelationshipBranch[]): QueryDslQueryContainer {
  return {function_score: {
    query: {match_all: {}}, functions: [{weight: 0}, ...relationships.map(branch => ({weight: branch.weight, filter: branch.query}))],
    score_mode: "max", boost_mode: "replace",
  }};
}

function hasPhraseWords(search: string): boolean {
  return (search.match(/[\p{L}\p{N}]+/gu)?.length ?? 0) >= 2;
}

// Shorter fragments ("udt", "cev") continue too many unrelated titles.
const minTitlePrefixLength = 4;
const minConceptLength = 3;

/**
 * Titles continuing the query: a phrase prefix for several words, or a title
 * word starting with a single unfinished word ("trans" for "Transgender").
 */
export function titlePrefixQuery(title: string | undefined, search: string): QueryDslQueryContainer | undefined {
  if (!title) return undefined;
  if (hasPhraseWords(search)) return {match_phrase_prefix: {[`${title}.exact`]: {query: search, max_expansions: 50}}};
  const word = search.trim().toLowerCase();
  if (word.length < minTitlePrefixLength || !/^[\p{L}\p{N}]+$/u.test(word)) return undefined;
  return {prefix: {[`${title}.exact`]: {value: word}}};
}

/**
 * For one-word queries on wiki/tag pages: the exact name, or a name whose first
 * word is the query or a near spelling of it ("career" for "Careers").
 */
function conceptNameFunctions(index: string, search: string, tokenCount: number): QueryDslFunctionScoreContainer[] {
  const word = search.trim().toLowerCase();
  if (index !== "tags" || tokenCount !== 1 || word.length < minConceptLength || !/^[\p{L}\p{N}]+$/u.test(word)) return [];
  const {conceptName, conceptLead, conceptWord} = rankingWeights.navigation;
  const exactName: QueryDslQueryContainer = {term: {"name.sort": {value: search.trim(), case_insensitive: true}}};
  const leadWord: QueryDslQueryContainer = {span_first: {match: {span_multi: {match: {fuzzy: {"name.exact": {value: word, fuzziness: "AUTO", prefix_length: 1}}}}}, end: 1}};
  return [
    {weight: conceptName, filter: exactName},
    {weight: conceptLead, filter: {bool: {should: [], must_not: [exactName], filter: [leadWord]}}},
    {weight: conceptWord, filter: {bool: {should: [], must_not: [exactName, leadWord], filter: [{match: {name: {query: word}}}]}}},
  ];
}

function phraseQuery({title, body}: IndexConfig, search: string): QueryDslQueryContainer {
  const phrases: QueryDslQueryContainer[] = [];
  if (title) phrases.push({match_phrase: {[`${title}.exact`]: {query: search, slop: 1}}});
  if (body) phrases.push({match_phrase: {[`${body}.exact`]: {query: search, slop: 2}}});
  return {bool: {should: phrases, minimum_should_match: 1}};
}

export function compoundTitleQuery(title: string | undefined, search: string): QueryDslQueryContainer | undefined {
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

export function matchFunctions(index: string, config: IndexConfig, search: string, tokenCount: number, scoreProximity: boolean): QueryDslFunctionScoreContainer[] {
  const {bm25, allTerms, phrase} = rankingWeights.match;
  const pivots: RankingPivots = rankingWeights.match.pivots;
  const fields = textFields(config);
  const functions: QueryDslFunctionScoreContainer[] = [
    {script_score: {script: {source: matchScript, params: {bm25, k: pivots[index] ?? 5}}}},
  ];
  if (tokenCount && fields.length) {
    const coverage: QueryDslQueryContainer = {multi_match: {
      query: search, fields, type: "cross_fields", operator: "and",
    }};
    const compound = scoreProximity ? compoundTitleQuery(config.title, search) : undefined;
    functions.push({weight: allTerms, filter: compound
      ? {dis_max: {queries: [coverage, compound], tie_breaker: 0}} : coverage});
  }
  if (scoreProximity && hasPhraseWords(search)) {
    functions.push({weight: phrase, filter: phraseQuery(config, search)});
  }
  return functions;
}

export function titleFunctions(index: string, config: IndexConfig, search: string, tokenCount: number): QueryDslFunctionScoreContainer[] {
  const {title} = config;
  if (!title) return [];
  const functions: QueryDslFunctionScoreContainer[] = [];
  const titlePrefix = titlePrefixQuery(title, search);
  const titleCoverage: QueryDslQueryContainer = {match: {[title]: {query: search, operator: "and"}}};
  functions.push({weight: rankingWeights.match.titleAll * (tokenCount === 1 ? 0.5 : 1), filter: titlePrefix
    ? {bool: {should: [titleCoverage, titlePrefix], minimum_should_match: 1}}
    : titleCoverage});
  const navigationMatches: QueryDslQueryContainer[] = [{
    term: {[`${title}.sort`]: {value: search.trim(), case_insensitive: true}},
  }];
  if (titlePrefix) {
    navigationMatches.push({bool: {should: [], filter: [titlePrefix], must_not: [
      {match_phrase: {[`${title}.exact`]: {query: search, slop: 1}}},
    ]}});
    functions.push({weight: rankingWeights.match.phrase, filter: {bool: {
      should: [], filter: [titlePrefix], must_not: [phraseQuery(config, search)],
    }}});
  }
  functions.push({weight: navigationPoints(tokenCount), filter: {bool: {should: navigationMatches, minimum_should_match: 1}}});
  functions.push(...conceptNameFunctions(index, search, tokenCount));
  return functions;
}

export function curatedFunctions(index: string): QueryDslFunctionScoreContainer[] {
  return index === "posts" || index === "sequences"
    ? [{weight: rankingWeights.context.curated, filter: {term: {curated: true}}}]
    : [];
}

export function wantsUpcomingEvents(search: string, filters: QueryFilter[]): boolean {
  if (/\b(?:19|20)\d{2}\b/.test(search) || filters.some(filter => /date|time/i.test(filter.field))) return false;
  return /\b(?:meetups?|meetings?|events?|upcoming)\b/i.test(search)
    || filters.some(filter => filter.type === "facet" && filter.field === "isEvent" && filter.value === true && !filter.negated);
}

export function popularityFunctions({index, title, search, titleWord, person, eventIntent}: {
  index: string,
  title: string | undefined,
  search: string,
  titleWord: boolean,
  person?: PersonSearch,
  eventIntent: boolean,
}): QueryDslFunctionScoreContainer[] {
  const {context, popularity} = rankingWeights;
  const pivots: RankingPivots = popularity.pivots;
  const typeOffsets: RankingPivots = context.typeOffsets;
  const resolvedProfile: QueryDslQueryContainer | undefined = index === "users" && person && !person.topic
    ? {terms: {objectID: person.candidates.map(candidate => candidate.userId)}} : undefined;
  const params = {
    karmaField: karmaField(index), pivot: pivots[index], cap: index === "users" ? popularity.userCap : popularity.cap, slope: index === "users" ? popularity.userSlope : popularity.slope,
    gateFloor: popularity.gateFloor, matchMax: rankingWeights.match.topicalMax,
    baseline: context.baseline, typeOffset: typeOffsets[index] ?? 0,
    eventWeight: index === "posts" && eventIntent ? context.event : 0,
    eventScaleMs: 30 * dayMs, eventOffsetMs: 7 * dayMs, now: Date.now(),
  };
  const functions: QueryDslFunctionScoreContainer[] = [{
    ...(resolvedProfile ? {filter: {bool: {should: [], must_not: [resolvedProfile]}}} : {}),
    script_score: {script: {source: popularityScript, params}},
  }];
  const titlePrefix = titleWord ? titlePrefixQuery(title, search) : undefined;
  if (titlePrefix && title) functions.push({
    filter: {bool: {should: [{match: {[title]: {query: search}}}, titlePrefix], minimum_should_match: 1}},
    script_score: {script: {source: titleGateScript, params: {...params, titleGate: popularity.titleGate}}},
  });
  if (resolvedProfile) functions.push({filter: resolvedProfile, script_score: {script: {
    source: popularityScript, params: {...params, gateFloor: 1, typeOffset: 0},
  }}});
  return functions;
}
