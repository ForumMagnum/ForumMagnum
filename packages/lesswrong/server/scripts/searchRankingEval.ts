/* eslint-disable no-console */
import fs from "fs";
import { performance } from "perf_hooks";
import { createHash } from "crypto";
import { execFileSync } from "child_process";
import type { QueryDslQueryContainer, SearchRequest, SearchResponse } from "@elastic/elasticsearch/lib/api/types";
import type { Client } from "@elastic/elasticsearch";
import { buildEvaluationGroups, judgedPoolNdcg, navigationMetrics, targetKey, EvaluationGroup, EvaluationTarget, IntentFamily } from "./searchRankingEvaluationData";
import { parseQuery } from "../search/elastic/parseQuery";
import { judgedSearches } from "./searchRankingJudgments";
import { compilePersonLookup, resolvePersonSearch, PersonCandidate } from "../search/elastic/ElasticPersonSearch";
import ElasticClient, { executeMultiSearch, UnifiedSearchClient } from "../search/elastic/ElasticClient";
import ElasticQuery from "../search/elastic/ElasticQuery";
import { compileTopicalRecall, rankingWeights } from "../search/elastic/ElasticAdditiveRanking";
import type { UnifiedRanking } from "../search/elastic/unifiedSearchTypes";

/**
 * Offline evaluation of the unified (header) search ranking against the dev
 * Elasticsearch. Run from the REPL, for example:
 *
 *   yarn repl dev lw packages/lesswrong/server/scripts/searchRankingEval.ts 'calibrateMatchPivots()'
 *   yarn repl dev lw packages/lesswrong/server/scripts/searchRankingEval.ts 'compareRankings({limit: 200})'
 *   yarn repl dev lw packages/lesswrong/server/scripts/searchRankingEval.ts 'runStressSuite()'
 *   yarn repl dev lw packages/lesswrong/server/scripts/searchRankingEval.ts 'showQuery("lab automation")'
 *
 * Clicked targets from the analytics export are candidates, not ground truth:
 * an unclicked result is unknown, not irrelevant. Judge pairs by hand before
 * changing weights.
 */

const defaultEvidencePath = "/tmp/forum-search-report/query-target-evidence.csv";
const allIndexes = ["posts", "comments", "users", "tags", "sequences"];
const rankings: UnifiedRanking[] = ["tiered", "additive"];

interface EvidenceRow {
  query: string;
  context: string;
  resultType: string;
  resultId: string;
  resultTitle: string;
  clicks: number;
}

interface HitSummary {
  index: string;
  objectID: string;
  title: string;
  karma: number;
  score: number;
}

/** Minimal RFC 4180 reader: the evidence file has quoted titles with commas and doubled quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function readEvidence(csvPath = defaultEvidencePath, context = "searchBar"): EvidenceRow[] {
  const [header, ...rows] = parseCsv(fs.readFileSync(csvPath, "utf8"));
  const column = (name: string) => header.indexOf(name);
  return rows.filter(row => row.length >= header.length).map(row => ({
    query: row[column("query")].trim(),
    context: row[column("context")],
    resultType: row[column("result_type")],
    resultId: row[column("result_id")],
    resultTitle: row[column("result_title")],
    clicks: Number(row[column("recorded_clicks")]) || 0,
  })).filter(row => row.query && row.context === context);
}

export function summarizeHit(hit: {_index: string; _score?: number | null; _source?: SearchDocument}): HitSummary {
  const source = hit._source;
  const index = hit._index.split("_")[0];
  const title = source && "title" in source && source.title ? source.title
    : source && "displayName" in source ? source.displayName
    : source && "name" in source ? source.name
    : source && "postTitle" in source ? `Comment on: ${source.postTitle ?? ""}`
    : "";
  const karma = source && "karma" in source ? source.karma
    : source && "baseScore" in source ? source.baseScore ?? 0
    : 0;
  return {index, objectID: source?.objectID ?? "", title, karma, score: hit._score ?? 0};
}

async function rankedHits(client: Client, search: string, ranking: UnifiedRanking, limit: number): Promise<HitSummary[]> {
  const response = await executeMultiSearch(client, {ranking, indexes: allIndexes, search, limit});
  return response.hits.hits.map(summarizeHit);
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** Fail closed: this evaluator must never silently select production settings. */
export function assertDevEvaluation() {
  if (process.env.ENV_NAME !== "localLwDevDb") throw new Error("Ranking evaluation requires ENV_NAME=localLwDevDb and yarn repl dev lw");
}

export function evaluationClient(): Client {
  assertDevEvaluation();
  return new ElasticClient().getClient().child({requestTimeout: 15000, maxRetries: 0});
}

function currentMatchPivot(index: string): number | undefined {
  const pivots: Record<string, number> = rankingWeights.match.pivots;
  return pivots[index];
}

const inventoryPath = "/tmp/forum-search-report/intent-inventory.json";
function evaluationGroups(csvPath: string): EvaluationGroup[] {
  const inventory: IntentFamily[] = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
  return buildEvaluationGroups(readEvidence(csvPath), inventory);
}

async function corpusSnapshot(client: Client) {
  const entries = [];
  for (const index of allIndexes) {
    const info = await client.indices.get({index});
    const stats = await client.indices.stats({index, metric: ["docs", "indexing"]});
    entries.push({alias: index, indexes: Object.entries(info).map(([name, value]) => ({
      name, uuid: value.settings?.index?.uuid,
      mappingHash: createHash("sha256").update(JSON.stringify(value.mappings)).digest("hex"),
      fields: Object.keys(value.mappings?.properties ?? {}).sort(),
      stats: stats.indices?.[name]?.primaries,
    }))});
  }
  return entries;
}

interface FrozenIndex { alias: string; indexes: {name: string}[] }
interface FrozenSearch { searchClient: UnifiedSearchClient; close: () => Promise<void> }

/** PIT freezes candidate lookup, target eligibility, and both rankings on the same physical corpus. */
async function openFrozenSearch(client: Client, snapshot: FrozenIndex[]): Promise<FrozenSearch> {
  const names = new Map(snapshot.map(entry => [entry.alias, entry.indexes.map(index => index.name)]));
  const opened = await client.openPointInTime({index: snapshot.flatMap(entry => entry.indexes.map(index => index.name)), keep_alive: "20m"});
  let pitId = opened.id;
  return {
    searchClient: {
      async search<TDocument>(request: SearchRequest): Promise<SearchResponse<TDocument>> {
        const originalIndexes = typeof request.index === "string" ? [request.index] : request.index ?? [];
        const selected = originalIndexes.flatMap(index => {
          const physical = names.get(index);
          if (!physical) throw new Error("Unexpected PIT index");
          return physical;
        });
        const rewritten: SearchRequest = JSON.parse(JSON.stringify(request, (key, value: unknown) => {
          // A PIT spans every content type, including shards without user karma.
          if (key === "karma" && (value === "asc" || value === "desc")) return {order: value, unmapped_type: "long"};
          if (key === "_index" && typeof value === "string" && value !== "asc" && value !== "desc") {
            const physical = names.get(value);
            if (!physical || physical.length !== 1) throw new Error("PIT evaluation requires one physical index per alias");
            return physical[0];
          }
          return value;
        }));
        delete rewritten.index;
        rewritten.pit = {id: pitId, keep_alive: "20m"};
        rewritten.timeout = "10s";
        rewritten.allow_partial_search_results = false;
        rewritten.query = {bool: {should: [], filter: [{terms: {_index: selected}}], must: [rewritten.query ?? {match_all: {}}]}};
        const response = await client.search<TDocument>(rewritten);
        if (response.pit_id) pitId = response.pit_id;
        if (response.timed_out || response._shards.failed) throw new Error("Incomplete PIT search");
        return response;
      },
    },
    async close() { await client.closePointInTime({id: pitId}); },
  };
}

function sourceFingerprint() {
  const files = ["ElasticAdditiveRanking.ts", "ElasticClient.ts", "ElasticQuery.ts", "ElasticPersonSearch.ts", "ElasticMultiQuery.ts", "searchTokens.ts", "parseQuery.ts", "ElasticUnifiedSort.ts", "ElasticConfig.ts"];
  const paths = [
    ...files.map(file => `packages/lesswrong/server/search/elastic/${file}`),
    "packages/lesswrong/server/scripts/searchRankingEvaluationData.ts",
    "packages/lesswrong/server/scripts/searchRankingJudgments.ts",
  ];
  return Object.fromEntries(paths.map(path => [path, createHash("sha256").update(fs.readFileSync(path)).digest("hex")]));
}

function stableSampleKey(query: string): string { return createHash("sha256").update(`sample-v1:${query}`).digest("hex"); }
function residualEligibility(index: string, userIds: string[]): QueryDslQueryContainer[] {
  if (index === "posts") return [{bool: {should: [{terms: {userId: userIds}}, {terms: {coauthorIds: userIds}}], minimum_should_match: 1}}];
  if (index === "comments") return [{terms: {userId: userIds}}];
  if (index === "sequences") return [{terms: {collectedAuthorIds: userIds}}];
  return [{match_none: {}}];
}

/** Calibrate exactly the raw topical query used inside the production scorer, including residual topics. */
export async function calibrateMatchPivots(csvPath = defaultEvidencePath, sampleSize = 200, out = "/tmp/forum-search-report/topical-calibration.json") {
  const client = evaluationClient();
  const groups = evaluationGroups(csvPath).filter(group => group.split === "training").sort((a, b) => stableSampleKey(a.query).localeCompare(stableSampleKey(b.query))).slice(0, sampleSize);
  const before = await corpusSnapshot(client);
  const samples: {query: string; topic: string; index: string; scores: number[]}[] = [];
  const failures: string[] = [];
  for (const group of groups) {
    try {
      const lookup = compilePersonLookup(group.query);
      const candidates = lookup ? await client.search<PersonCandidate>({...lookup, timeout: "10s"}) : undefined;
      if (candidates?.timed_out || candidates?._shards.failed) throw new Error("Incomplete calibration lookup");
      const person = resolvePersonSearch(group.query, candidates?.hits.hits.flatMap(hit => hit._source ? [hit._source] : []) ?? []);
      for (const topic of [...new Set([group.query, ...(person?.topic ? [person.topic] : [])])]) {
        for (const index of allIndexes) {
          const eligibility = new ElasticQuery({index, search: group.query, filters: [], unifiedRanking: true}).compileAdditiveRecall().filters ?? [];
          const relationshipFilters: QueryDslQueryContainer[] = topic !== group.query && person ? residualEligibility(index, person.userIds) : [];
          const response = await client.search<SearchDocument>({index: allIndexes, size: 10, _source: false, timeout: "10s", search_type: "dfs_query_then_fetch", allow_partial_search_results: false,
            query: {bool: {should: [], filter: [{term: {_index: index}}, ...eligibility, ...relationshipFilters], must: [compileTopicalRecall(index, topic)]}},
          });
          if (response.timed_out) throw new Error("timeout");
          samples.push({query: group.query, topic, index, scores: response.hits.hits.map(hit => hit._score ?? 0)});
        }
      }
    } catch { failures.push(group.query); }
    fs.writeFileSync(out, JSON.stringify({status: "running", samples, failures}));
  }
  const report = Object.fromEntries(allIndexes.map(index => {
    const scores = samples.filter(sample => sample.index === index).flatMap(sample => sample.scores).sort((a, b) => a - b);
    return [index, {samples: scores.length, median: median(scores), p90: scores[Math.floor(scores.length * 0.9)] ?? null, currentPivot: currentMatchPivot(index)}];
  }));
  fs.writeFileSync(out, JSON.stringify({status: "complete", time: new Date().toISOString(), source: sourceFingerprint(), before, after: await corpusSnapshot(client), groups, report, samples, failures}, null, 2));
  console.table(report);
  return report;
}

interface CompareOptions { csvPath?: string; limit?: number; queries?: string[]; out?: string }
interface TargetStatus extends EvaluationTarget { status: "eligible" | "absent" | "ineligible" }
interface RankingResult { hits: HitSummary[]; firstTargetRank: number | null; error?: "request-failed"; errorReason?: string }
interface DetailedEvaluation extends EvaluationGroup {
  targetStatus: TargetStatus[];
  results: Record<UnifiedRanking, RankingResult>;
}

async function targetStatus(client: UnifiedSearchClient, group: EvaluationGroup): Promise<TargetStatus[]> {
  const results: TargetStatus[] = [];
  for (const index of allIndexes) {
    const targets = group.targets.filter(target => target.index === index);
    if (!targets.length) continue;
    const ids = targets.map(target => target.objectID);
    const present = await client.search<SearchDocument>({index, size: ids.length, _source: ["objectID"], timeout: "10s", allow_partial_search_results: false, query: {terms: {objectID: ids}}});
    const eligibility = new ElasticQuery({index, search: group.query, filters: [], unifiedRanking: true}).compileAdditiveRecall().filters ?? [];
    const eligible = await client.search<SearchDocument>({index, size: ids.length, _source: ["objectID"], timeout: "10s", allow_partial_search_results: false, query: {bool: {should: [], filter: [...eligibility, {terms: {objectID: ids}}]}}});
    if (present.timed_out || eligible.timed_out) throw new Error("timeout");
    const presentIds = new Set(present.hits.hits.map(hit => hit._source?.objectID));
    const eligibleIds = new Set(eligible.hits.hits.map(hit => hit._source?.objectID));
    for (const target of targets) results.push({...target, status: eligibleIds.has(target.objectID) ? "eligible" : presentIds.has(target.objectID) ? "ineligible" : "absent"});
  }
  return results;
}

function summarizeEvaluations(evaluations: DetailedEvaluation[]) {
  const summary = [];
  for (const split of ["training", "holdout"] as const) {
    for (const cohort of ["all-click-candidates", "navigation"] as const) {
      const selected = evaluations.filter(evaluation => evaluation.split === split && (cohort !== "navigation" || evaluation.categories.some(category => ["Find a person", "Find a known post", "Find a concept page"].includes(category))));
      const eligible = selected.filter(evaluation => evaluation.targetStatus.some(target => target.status === "eligible"));
      // Paired denominator: an error in either system excludes the query from both.
      const paired = eligible.filter(evaluation => !evaluation.results.tiered.error && !evaluation.results.additive.error);
      for (const ranking of rankings) summary.push({split, cohort, ranking, unavailableQueries: selected.length - eligible.length, failedQueries: eligible.length - paired.length,
        ...navigationMetrics(paired.map(evaluation => evaluation.results[ranking].firstTargetRank)),
      });
    }
  }
  return summary;
}

/** Header-search click candidates only. Null rank is a miss only for an eligible target and a successful request. */
export async function compareRankings({csvPath = defaultEvidencePath, limit = 1000, queries, out = "/tmp/forum-search-report/ranking-evaluation.json"}: CompareOptions = {}) {
  const client = evaluationClient();
  const groups = evaluationGroups(csvPath);
  const selected = groups.filter(group => !queries || queries.includes(group.query)).slice(0, limit);
  const startedAt = new Date().toISOString();
  const before = await corpusSnapshot(client);
  const frozen = await openFrozenSearch(client, before);
  const metadata = {pointInTime: true, startedAt, environment: process.env.ENV_NAME, gitHead: execFileSync("git", ["rev-parse", "HEAD"], {encoding: "utf8"}).trim(), source: sourceFingerprint(), weights: rankingWeights,
    context: "searchBar", contextRows: readEvidence(csvPath).length, inventorySha256: createHash("sha256").update(fs.readFileSync(inventoryPath)).digest("hex"), evaluatorSha256: createHash("sha256").update(fs.readFileSync("packages/lesswrong/server/scripts/searchRankingEval.ts")).digest("hex"), evidenceSha256: createHash("sha256").update(fs.readFileSync(csvPath)).digest("hex"), splitRule: "SHA256(unified-ranking-v1:connected-family) mod 5 = 0 holdout; connect all shared typed targets and query variants", before};
  try {
    const combinedTargets = [...new Map(selected.flatMap(group => group.targets).map(target => [targetKey(target), target])).values()];
    const commonStatuses = new Map((await targetStatus(frozen.searchClient, {query: "", family: "all", categories: [], split: "training", targets: combinedTargets})).map(target => [targetKey(target), target]));
    const evaluations: DetailedEvaluation[] = [];
    const failures: string[] = [];
    for (const group of selected) {
      try {
        const status = parseQuery(group.query).isAdvanced ? await targetStatus(frozen.searchClient, group) : group.targets.flatMap(target => {
          const known = commonStatuses.get(targetKey(target));
          return known ? [known] : [];
        });
        const expected = new Set(status.filter(target => target.status === "eligible").map(targetKey));
        const evaluation: DetailedEvaluation = {...group, targetStatus: status, results: {tiered: {hits: [], firstTargetRank: null}, additive: {hits: [], firstTargetRank: null}}};
        for (const ranking of rankings) {
          if (!expected.size) continue;
          try {
            const response = await executeMultiSearch(frozen.searchClient, {ranking, indexes: allIndexes, search: group.query, limit: 10});
            const hits = response.hits.hits.map(summarizeHit);
            const first = hits.findIndex(hit => expected.has(`${hit.index}:${hit.objectID}`));
            evaluation.results[ranking] = {hits, firstTargetRank: first < 0 ? null : first + 1};
          } catch (error) { evaluation.results[ranking] = {hits: [], firstTargetRank: null, error: "request-failed", errorReason: error instanceof Error ? error.message.slice(0, 600) : "Unknown search failure"}; }
        }
        evaluations.push(evaluation);
      } catch { failures.push(group.query); }
      fs.writeFileSync(out, JSON.stringify({status: "running", metadata, evaluations, failures}));
      if ((evaluations.length + failures.length) % 10 === 0) console.log(`Evaluated ${evaluations.length + failures.length}/${selected.length}`);
    }
    const after = await corpusSnapshot(client);
    const summary = summarizeEvaluations(evaluations);
    fs.writeFileSync(out, JSON.stringify({status: "complete", metadata, finishedAt: new Date().toISOString(), after, corpusChanged: JSON.stringify(before) !== JSON.stringify(after), summary, evaluations, failures}, null, 2));
    console.table(summary);
    return summary;
  } finally { await frozen.close(); }
}

/** Print the top hits for one query under one ranking, for manual judgment. */
export async function showQuery(search: string, ranking: UnifiedRanking = "additive", limit = 10) {
  const hits = await rankedHits(evaluationClient(), search, ranking, limit);
  console.table(hits.map(hit => ({...hit, title: hit.title.slice(0, 70), score: Number(hit.score.toFixed(2))})));
  return hits;
}

interface StressCase {
  query: string;
  /** Any of these IDs at or above `within` passes. */
  targets: string[];
  within: number;
  note: string;
}

/**
 * Assertions from the recommendations, using IDs observed in the evidence
 * export. Target positions are proposals for review, not measured truth.
 */
export const stressSuite: StressCase[] = [
  {query: "A Pragmatic Vision for Interpretability", targets: ["StENzDcD3kpfGJssR"], within: 1, note: "distinctive full title"},
  {query: "a pragmatic vision for interpretability", targets: ["StENzDcD3kpfGJssR"], within: 1, note: "case variant"},
  {query: "navier", targets: ["yekQKwmQJNk7thDtQ"], within: 3, note: "popular known post fragment"},
  {query: "navier-strokes", targets: ["yekQKwmQJNk7thDtQ"], within: 3, note: "typo and hyphen"},
  {query: "navier stokes", targets: ["yekQKwmQJNk7thDtQ"], within: 3, note: "two words"},
  {query: "dear god", targets: ["6j3kBHdowGLCeqobg"], within: 3, note: "remembered title fragment"},
  {query: "Well kept gardens die by", targets: ["tscc3e5eujrsEeFN4"], within: 3, note: "classic from incomplete title"},
  {query: "shut up and do the impo", targets: ["nCvvhFBaayaXyuBiD"], within: 3, note: "classic, unfinished word"},
  {query: "hammertime day 3", targets: ["ESnzpoCJrAfwAzpMB"], within: 3, note: "chapter entry point"},
  {query: "open source game theory", targets: ["5X8bXKaPNiZsNw2FG"], within: 3, note: "hyphenated title from spaced query"},
  {query: "j-space", targets: ["EnxHPxJT4Xin5cTsX", "2Ef7zM7eMpAB7nvcR"], within: 3, note: "hyphenated concept"},
  {query: "infra-bayesiansism", targets: ["zB4f7QqKhBHa5b37a"], within: 5, note: "misspelled concept"},
  {query: "kwa", targets: ["x5S2Kuj6TfQTGuo63"], within: 3, note: "surname"},
  {query: "paulf", targets: ["gb44edJjXhte8DA3A"], within: 3, note: "handle prefix"},
  {query: "johnswentwroth", targets: ["MEu8MdhruX5jfGsFQ"], within: 3, note: "transposed handle"},
  {query: "elizer yud", targets: ["nmk3nLpQE89dMRzzN"], within: 3, note: "misspelled name with prefix"},
  {query: "evan hubinger", targets: ["AThTtkDufXp3rmMDa"], within: 3, note: "real name of a handle account"},
  {query: "richard ngo", targets: ["BCmzFRdQhqLPREvat"], within: 3, note: "name with underscore handle"},
  {query: "zvi", targets: ["N9zj5qpTfqmbn9dro"], within: 1, note: "established author"},
  {query: "byrne", targets: ["vRcer5FTqagjMkcDz"], within: 3, note: "surname fragment"},
  {query: "ryan", targets: ["dfZAq9eZxs4BB4Ji5"], within: 3, note: "ambiguous first name"},
  {query: "roko", targets: ["73WJbnX59kE4afuuY", "WBJZoeJypcNRmsdHx"], within: 3, note: "author and topic"},
  {query: "neel nanda how to become an interpretability", targets: ["jP9KDyMkchuv6tHwm"], within: 5, note: "author plus conversational topic"},
  {query: "elizabeth nice things", targets: ["rBauzJHPYaanPJ7Br"], within: 5, note: "author plus topic words"},
  {query: "access past memories", targets: ["qk3GpncPthuG3FStw", "An8cqm9y5BkuCTjpj", "3r7pbzSH3a9aXPHGZ"], within: 10, note: "relevant comments"},
  {query: "cal newport", targets: ["dTBndrkqKTpYCYgpW", "mFEgiqXpjDbKQLDg9", "hdbgodzQLwrLPZsWm"], within: 10, note: "comments about a person"},
  {query: "lab automation", targets: ["FLApaycSw7gwf5vo3", "Zwb2TxaoGv73t9CW4"], within: 5, note: "popular substantive match candidate"},
  {query: "medianworld", targets: ["RERM5H6RMnaafxMwQ"], within: 3, note: "wiki entry point"},
  {query: "productivity", targets: ["udPbn9RthmgTtHMiG", "ArizxGwbqiohBX5y6"], within: 5, note: "topic page and guide"},
  {query: "governance", targets: ["gzJ7QNhd3tCLkbmYC"], within: 5, note: "useful overview for a generic word"},
  {query: "https://www.lesswrong.com/posts/yekQKwmQJNk7thDtQ", targets: ["yekQKwmQJNk7thDtQ"], within: 1, note: "pasted internal URL"},
  {query: "yekQKwmQJNk7thDtQ", targets: ["yekQKwmQJNk7thDtQ"], within: 1, note: "document ID"},
];

/** IDs present in the selected index. Absent targets cannot be judged there. */
async function indexedIds(client: Client, ids: string[]): Promise<Set<string>> {
  const response = await client.search<SearchDocument>({
    index: allIndexes, size: ids.length, _source: ["objectID"], query: {terms: {objectID: ids}},
  });
  return new Set(response.hits.hits.flatMap(hit => hit._source ? [hit._source.objectID] : []));
}

export async function runStressSuite(ranking: UnifiedRanking = "additive", limit = 10) {
  const client = evaluationClient();
  const present = await indexedIds(client, [...new Set(stressSuite.flatMap(stressCase => stressCase.targets))]);
  const results = [];
  for (const stressCase of stressSuite) {
    const targets = stressCase.targets.filter(target => present.has(target));
    const hits = targets.length ? await rankedHits(client, stressCase.query, ranking, limit) : [];
    const position = hits.findIndex(hit => targets.includes(hit.objectID));
    const rank = position < 0 ? null : position + 1;
    results.push({
      query: stressCase.query.slice(0, 44),
      note: stressCase.note,
      within: stressCase.within,
      rank: targets.length ? rank ?? "-" : "absent",
      pass: !targets.length ? "n/a" : rank !== null && rank <= stressCase.within ? "yes" : "NO",
      top: hits[0] ? `${hits[0].index}: ${hits[0].title.slice(0, 44)}` : "",
    });
  }
  console.table(results);
  const judged = results.filter(result => result.pass !== "n/a");
  const passed = judged.filter(result => result.pass === "yes").length;
  console.log(`${ranking}: ${passed}/${judged.length} passed (${results.length - judged.length} targets absent from this index)`);
  return results;
}

/** Persist public indexed text for explicit human/agent judgments; clicks alone never set grades. */
export async function collectJudgmentPool(search: string, out: string) {
  const client = evaluationClient();
  const hits = [];
  for (const ranking of rankings) {
    const response = await executeMultiSearch(client, {ranking, indexes: allIndexes, search, limit: 5});
    hits.push(...response.hits.hits.map(summarizeHit));
  }
  const documents = [];
  for (const index of allIndexes) {
    const ids = [...new Set(hits.filter(hit => hit.index === index).map(hit => hit.objectID))];
    if (!ids.length) continue;
    const response = await client.search<SearchDocument>({index, size: ids.length, timeout: "10s", allow_partial_search_results: false,
      _source: ["objectID", "title", "body", "name", "description", "plaintextDescription", "baseScore", "karma"], query: {terms: {objectID: ids}},
    });
    if (response.timed_out) throw new Error("Incomplete judgment pool");
    documents.push(...response.hits.hits.map(hit => ({index, source: hit._source})));
  }
  fs.writeFileSync(out, JSON.stringify({search, time: new Date().toISOString(), hits, documents}, null, 2));
  return {out, count: documents.length};
}

/** Small explicitly judged pool; report separately from broad click-candidate metrics. */
export async function evaluateJudgedSearches(out = "/tmp/forum-search-report/judged-ranking-evaluation.json") {
  const client = evaluationClient();
  const results = [];
  for (const judged of judgedSearches) {
    const group: EvaluationGroup = {query: judged.query, family: "exploratory-agent-judgments", categories: ["Explore a topic"], split: "training", targets: judged.judgments};
    const statuses = await targetStatus(client, group);
    const eligible = new Set(statuses.filter(target => target.status === "eligible").map(targetKey));
    const grades = new Map(judged.judgments.filter(target => eligible.has(targetKey(target))).map(target => [targetKey(target), target.grade]));
    for (const ranking of rankings) {
      const response = await executeMultiSearch(client, {ranking, indexes: allIndexes, search: judged.query, limit: 100});
      const hits = response.hits.hits.map(summarizeHit);
      const keys = hits.map(hit => `${hit.index}:${hit.objectID}`);
      const pairs = judged.preferences.map(pair => {
        const preferredRank = keys.indexOf(targetKey(pair.preferred)) + 1;
        const otherRank = keys.indexOf(targetKey(pair.over)) + 1;
        return {...pair, preferredRank, otherRank, status: !eligible.has(targetKey(pair.preferred)) || !eligible.has(targetKey(pair.over)) ? "unavailable" : preferredRank && !otherRank ? "pass-over-unrecalled" : !preferredRank || !otherRank ? "not-comparable-within-100" : preferredRank < otherRank ? "pass" : "fail"};
      });
      results.push({query: judged.query, ranking, judgedPoolNdcgAt10: judgedPoolNdcg(keys, grades), judgedInTop10: keys.slice(0, 10).filter(key => grades.has(key)).length, pairs, hits});
      fs.writeFileSync(out, JSON.stringify({status: "running", judgments: judgedSearches, results}, null, 2));
    }
  }
  fs.writeFileSync(out, JSON.stringify({status: "complete", time: new Date().toISOString(), source: sourceFingerprint(), judgments: judgedSearches, results}, null, 2));
  return results.map(result => ({query: result.query, ranking: result.ranking, judgedPoolNdcgAt10: result.judgedPoolNdcgAt10, pairs: result.pairs}));
}

export async function inspectAliasCoverage(out = "/tmp/forum-search-report/author-alias-coverage.json") {
  const client = evaluationClient();
  const withFullName = await client.count({index: "users", query: {exists: {field: "fullName"}}});
  const all = await client.count({index: "users"});
  const response = await client.search<PersonCandidate>({index: "users", size: 10, timeout: "10s", allow_partial_search_results: false,
    _source: ["objectID", "displayName", "slug", "fullName", "karma"],
    query: {terms: {objectID: ["AThTtkDufXp3rmMDa", "BCmzFRdQhqLPREvat", "gb44edJjXhte8DA3A", "x5S2Kuj6TfQTGuo63", "MEu8MdhruX5jfGsFQ"]}},
  });
  if (response.timed_out) throw new Error("Incomplete alias inspection");
  const report = {time: new Date().toISOString(), totalUsers: all.count, usersWithFullName: withFullName.count, candidates: response.hits.hits.flatMap(hit => hit._source ? [hit._source] : [])};
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  return report;
}


/** Small diagnostic sample, not a production latency benchmark. */
export async function evaluateLiveExamples(out = "/tmp/forum-search-report/live-ranking-examples.json") {
  const client = evaluationClient();
  const results = [];
  for (const search of ["infrabayesiansism", "chemicalenginering", "interpretability", "american coll", "computation in", "evan hubinger", "kwa", "paulf", "johnswentwroth", "roko"]) {
    for (const repetition of [1, 2]) {
      const started = Date.now();
      const response = await executeMultiSearch(client, {ranking: "additive", indexes: allIndexes, search, limit: 10});
      results.push({search, repetition, elapsedMs: Date.now() - started, hits: response.hits.hits.map(summarizeHit)});
    }
  }
  fs.writeFileSync(out, JSON.stringify({time: new Date().toISOString(), environment: process.env.ENV_NAME, weights: rankingWeights, results}, null, 2));
  return results.map(({search, repetition, elapsedMs}) => ({search, repetition, elapsedMs}));
}

interface LatencySample {
  query: string;
  ranking: UnifiedRanking;
  pass: number;
  position: number;
  elapsedMs: number;
  requests: number;
  elasticMs: number;
  hits?: number;
  error?: string;
}

async function measureRanking(client: UnifiedSearchClient, query: string, ranking: UnifiedRanking, pass: number, position: number): Promise<LatencySample> {
  const sample: LatencySample = {query, ranking, pass, position, elapsedMs: 0, requests: 0, elasticMs: 0};
  const measuredClient: UnifiedSearchClient = {
    async search<TDocument>(request: SearchRequest): Promise<SearchResponse<TDocument>> {
      sample.requests++;
      const response = await client.search<TDocument>(request);
      sample.elasticMs += response.took;
      return response;
    },
  };
  const started = performance.now();
  try {
    const response = await executeMultiSearch(measuredClient, {ranking, indexes: allIndexes, search: query, limit: 10});
    sample.hits = response.hits.hits.length;
  } catch (error) {
    sample.error = error instanceof Error ? error.message : String(error);
  }
  sample.elapsedMs = performance.now() - started;
  return sample;
}

/** Read-only latency comparison: pass zero warms both rankers; measured passes reverse pair order. */
export async function benchmarkRankings({csvPath = defaultEvidencePath, out = "/tmp/forum-search-report/ranking-latency.json", limit = 1000, measuredPasses = 2} = {}) {
  if (!Number.isInteger(measuredPasses) || measuredPasses < 1) throw new Error("measuredPasses must be a positive integer");
  const client = evaluationClient();
  const groups = evaluationGroups(csvPath).sort((a, b) => stableSampleKey(a.query).localeCompare(stableSampleKey(b.query))).slice(0, limit);
  const before = await corpusSnapshot(client);
  const frozen = await openFrozenSearch(client, before);
  const metadata = {
    startedAt: new Date().toISOString(), environment: process.env.ENV_NAME,
    source: sourceFingerprint(), before, queryCount: groups.length, measuredPasses,
    evidenceSha256: createHash("sha256").update(fs.readFileSync(csvPath)).digest("hex"),
    methodology: "Single sequential client, PIT shared by both rankers, top 10 with highlights and exact totals. Pass 0 warms all queries. Pair order alternates by query and pass. Includes compilation, person lookup, sequence lookup when applicable, transport and PIT rewriting; excludes REPL startup and report writes. Each unique query has equal weight.",
  };
  const samples: LatencySample[] = [];
  try {
    for (let pass = 0; pass <= measuredPasses; pass++) {
      for (let i = 0; i < groups.length; i++) {
        const order = (i + pass) % 2 ? [...rankings].reverse() : rankings;
        for (let position = 0; position < order.length; position++) {
          samples.push(await measureRanking(frozen.searchClient, groups[i].query, order[position], pass, position));
        }
        if ((i + 1) % 25 === 0 || i + 1 === groups.length) {
          fs.writeFileSync(out, JSON.stringify({status: "running", metadata, samples}));
          console.log(`Latency pass ${pass}/${measuredPasses}: ${i + 1}/${groups.length}; failures: ${samples.filter(sample => sample.error).length}`);
        }
      }
    }
    const after = await corpusSnapshot(client);
    fs.writeFileSync(out, JSON.stringify({status: "complete", metadata, finishedAt: new Date().toISOString(), after, samples}, null, 2));
    return {out, samples: samples.length, failures: samples.filter(sample => sample.error).length};
  } finally {
    await frozen.close();
  }
}
