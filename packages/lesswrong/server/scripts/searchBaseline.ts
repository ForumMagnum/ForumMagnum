/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import http from "http";
import { createHash } from "crypto";
import { execFileSync } from "child_process";
import { performance } from "perf_hooks";
import type { Client } from "@elastic/elasticsearch";
import type { QueryDslQueryContainer, SearchRequest, SearchResponse } from "@elastic/elasticsearch/lib/api/types";
import { executeSearch, SearchExecutor } from "../search/elastic/ElasticClient";
import { rankingWeights } from "../search/elastic/ElasticAdditiveRanking";
import { indexNameToConfig } from "../search/elastic/ElasticConfig";
import { compilePersonLookup, PersonCandidate, resolvePersonSearch } from "../search/elastic/ElasticPersonSearch";
import { evaluationClient, summarizeHit } from "./searchRankingEval";
import { getAnalyticsConnectionOrThrow } from "../analytics/postgresConnection";
import { aggregateClicks, clickReport, ClickedSearch, ClickReportRow, ClickTarget, hitRates, HitRates, mergeClickedSearches, SearchClick } from "./searchBaselineClicks";
import { compareRuns, Expectation, GoldenQuery, GoldenSet, Grade, hitKey, RunEntry, RunHit, SearchIntentCategory, searchIntentCategories, SearchRun, validateGoldenSet } from "./searchBaselineMetrics";

const dataDir = "packages/lesswrong/server/scripts/searchBaselineData";
const goldenSetPath = path.join(dataDir, "goldenSet.json");
const corpusPath = path.join(dataDir, "corpus.json");
const runsDir = path.join(dataDir, "runs");
const viewerPath = "packages/lesswrong/server/scripts/searchBaselineViewer.html";
const allIndexes = ["posts", "comments", "users", "tags", "sequences"];
const frozenPrefix = "searcheval-";
const runDepth = 20;
const runConcurrency = 8;

interface FrozenCorpus {
  tag: string;
  frozenAt: string;
  indexes: Record<string, {name: string; source: string; docs: number}>;
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file: string, value: unknown) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function readGoldenSet(): GoldenSet {
  return fs.existsSync(goldenSetPath) ? readJson<GoldenSet>(goldenSetPath) : {version: 1, queries: []};
}

function writeGoldenSet(golden: GoldenSet) {
  const problems = validateGoldenSet(golden);
  if (problems.length) throw new Error(`Refusing to write an invalid golden set: ${problems.join("; ")}`);
  writeJson(goldenSetPath, golden);
}

function readCorpus(): FrozenCorpus {
  if (!fs.existsSync(corpusPath)) throw new Error("No frozen corpus yet; run freezeSearchCorpus() first");
  return readJson<FrozenCorpus>(corpusPath);
}

function frozenNames(corpus: FrozenCorpus): Record<string, string> {
  return Object.fromEntries(Object.entries(corpus.indexes).map(([alias, index]) => [alias, index.name]));
}

/**
 * Redirect every alias in a compiled request to its frozen copy. The ranking
 * code addresses indexes by alias both in `index` and in `_index` term filters.
 */
function frozenRequest(request: SearchRequest, names: Record<string, string>): SearchRequest {
  const rewritten: SearchRequest = JSON.parse(JSON.stringify(request, (key, value: unknown) => {
    if (key === "_index" && typeof value === "string" && names[value]) return names[value];
    return value;
  }));
  const requested = typeof request.index === "string" ? request.index.split(",") : request.index ?? [];
  rewritten.index = requested.map(index => {
    if (!names[index]) throw new Error(`Baseline search attempted an index outside the frozen corpus: ${index}`);
    return names[index];
  });
  rewritten.timeout = "10s";
  return rewritten;
}

function frozenExecutor(client: Client, corpus: FrozenCorpus): SearchExecutor {
  const names = frozenNames(corpus);
  const aliases = new Map(Object.entries(names).map(([alias, name]) => [name, alias]));
  return {
    async search<TDocument>(request: SearchRequest): Promise<SearchResponse<TDocument>> {
      const response = await client.search<TDocument>(frozenRequest(request, names));
      // Report hits under their alias so result keys match grades recorded on any corpus.
      for (const hit of response.hits.hits) hit._index = aliases.get(hit._index) ?? hit._index;
      return response;
    },
  };
}

function gitState() {
  const head = execFileSync("git", ["rev-parse", "--short", "HEAD"], {encoding: "utf8"}).trim();
  const diff = execFileSync("git", ["diff", "HEAD", "--", "packages/lesswrong/server/search"], {encoding: "utf8"});
  return {head, dirty: diff.length > 0, fingerprint: createHash("sha256").update(head + diff).digest("hex").slice(0, 12)};
}

/** Captured once, when the REPL loads this module, because that is the code every run uses. */
const loadedCode = gitState();

/**
 * Freeze the current dev indexes as cheap clones so baseline and candidate runs
 * see identical documents and term statistics. Cloning needs a brief write block
 * on each source index; dev syncs during that window fail and are logged.
 */
export async function freezeSearchCorpus(tag = new Date().toISOString().slice(0, 10)) {
  const client = evaluationClient();
  const corpus: FrozenCorpus = {tag, frozenAt: new Date().toISOString(), indexes: {}};
  for (const alias of allIndexes) {
    const physical = Object.keys(await client.indices.getAlias({name: alias}));
    if (physical.length !== 1) throw new Error(`Expected one index behind alias ${alias}, found ${physical.join(", ")}`);
    const source = physical[0];
    const target = `${frozenPrefix}${tag}-${alias}`;
    await client.indices.putSettings({index: source, settings: {"index.blocks.write": true}});
    try {
      await client.indices.clone({index: source, target, settings: {"index.number_of_replicas": 0}, wait_for_active_shards: 1});
    } finally {
      await client.indices.putSettings({index: source, settings: {"index.blocks.write": null}});
    }
    await client.indices.putSettings({index: target, settings: {"index.blocks.write": true}});
    const {count} = await client.count({index: target});
    corpus.indexes[alias] = {name: target, source, docs: count};
    console.log(`Froze ${alias}: ${source} -> ${target} (${count} documents)`);
  }
  writeJson(corpusPath, corpus);
  return corpus;
}

export async function deleteFrozenCorpus(tag: string) {
  if (!/^[\w.-]+$/.test(tag)) throw new Error("Invalid corpus tag");
  const client = evaluationClient();
  for (const alias of allIndexes) {
    await client.indices.delete({index: `${frozenPrefix}${tag}-${alias}`, ignore_unavailable: true});
  }
}

function hitPath(source: SearchDocument | undefined): string | undefined {
  if (!source) return undefined;
  switch (source._index) {
    case "posts": return `/posts/${source.objectID}/${source.slug}`;
    case "comments": return source.postId ? `/posts/${source.postId}?commentId=${source.objectID}` : undefined;
    case "users": return `/users/${source.slug}`;
    case "tags": return `/w/${source.slug}`;
    case "sequences": return `/s/${source.objectID}`;
  }
}

function toRunHit(hit: {_index: string; _score?: number | null; _source?: SearchDocument}): RunHit {
  const summary = summarizeHit(hit);
  return {...summary, key: hitKey(summary.index, summary.objectID), path: hitPath(hit._source)};
}

async function searchFrozen(executor: SearchExecutor, query: string, limit = runDepth): Promise<RunHit[]> {
  const response = await executeSearch(executor, {indexes: allIndexes, search: query, limit});
  return response.hits.hits.map(toRunHit);
}

async function runQuery(executor: SearchExecutor, query: GoldenQuery): Promise<RunEntry> {
  const started = performance.now();
  try {
    const hits = await searchFrozen(executor, query.query);
    return {queryId: query.id, query: query.query, hits, elapsedMs: performance.now() - started};
  } catch (error) {
    return {queryId: query.id, query: query.query, hits: [], elapsedMs: performance.now() - started, error: error instanceof Error ? error.message.slice(0, 400) : String(error)};
  }
}

function listRuns(): string[] {
  if (!fs.existsSync(runsDir)) return [];
  return fs.readdirSync(runsDir).filter(file => file.endsWith(".json")).map(file => file.replace(/\.json$/, "")).sort().reverse();
}

function readRun(name: string): SearchRun {
  if (!/^[\w.-]+$/.test(name)) throw new Error("Invalid run name");
  return readJson<SearchRun>(path.join(runsDir, `${name}.json`));
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({length: Math.min(concurrency, items.length)}, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await work(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

/** Run every golden query with the code this REPL loaded, against the frozen corpus. */
export async function runGoldenSet(label = "") {
  const client = evaluationClient();
  const corpus = readCorpus();
  const executor = frozenExecutor(client, corpus);
  const golden = readGoldenSet();
  let done = 0;
  const entries = await mapWithConcurrency(golden.queries, runConcurrency, async query => {
    const entry = await runQuery(executor, query);
    if (++done % 250 === 0) console.log(`Ran ${done}/${golden.queries.length}`);
    return entry;
  });
  const stamp = new Date().toISOString().replace(/[:]/g, "").slice(0, 15);
  const slug = label.replace(/[^\w-]+/g, "-").replace(/^-|-$/g, "");
  const name = [stamp, loadedCode.head + (loadedCode.dirty ? "-dirty" : ""), slug].filter(Boolean).join("-");
  const run: SearchRun = {
    name, createdAt: new Date().toISOString(), gitHead: loadedCode.head, dirty: loadedCode.dirty,
    codeFingerprint: loadedCode.fingerprint, corpusTag: corpus.tag, weights: rankingWeights, entries,
  };
  writeJson(path.join(runsDir, `${name}.json`), run);
  const failed = entries.filter(entry => entry.error).length;
  console.log(`Run ${name}: ${entries.length} queries, ${failed} failed`);
  return {name, queries: entries.length, failed};
}

/** Show how the loaded code resolves people for a query and ranks it on the frozen corpus. */
export async function explainFrozenSearch(query: string, limit = 10) {
  const executor = frozenExecutor(evaluationClient(), readCorpus());
  const lookup = compilePersonLookup(query);
  const candidates = lookup ? (await executor.search<PersonCandidate>(lookup)).hits.hits.flatMap(hit => hit._source ? [hit._source] : []) : [];
  const person = resolvePersonSearch(query, candidates);
  console.log(`Person lookup: ${candidates.length} candidates; top by score:`);
  console.table(candidates.slice(0, 8).map(candidate => ({displayName: candidate.displayName, slug: candidate.slug, karma: candidate.karma})));
  console.log(`Resolved: ${person ? JSON.stringify({confidence: person.confidence, topic: person.topic, candidates: person.candidates?.slice(0, 8)}) : "none"}`);
  const hits = await searchFrozen(executor, query, limit);
  console.table(hits.map(hit => ({key: hit.key, title: hit.title.slice(0, 60), karma: hit.karma, score: Number(hit.score.toFixed(2))})));
}

export function compareGoldenRuns(baseline: string, candidate: string) {
  const comparison = compareRuns(readGoldenSet(), readRun(baseline), readRun(candidate));
  console.table(comparison.categories);
  return comparison.summary;
}

/** Production LessWrong events; general search surfaces only, not user or tag pickers. */
const clickEnvironment = "lesswrong.com";
const clickContexts = ["searchBar", "searchPageTabbed"];
const lookupChunk = 1000;

function fetchSearchClicks(environment: string, since: string): Promise<SearchClick[]> {
  return getAnalyticsConnectionOrThrow().any<SearchClick>(`
    -- searchBaseline.fetchSearchClicks
    SELECT
      event->>'query' AS query,
      event->>'resultId' AS "resultId",
      event->>'resultType' AS "resultType",
      COALESCE('u:' || (event->>'userId'), 'c:' || (event->>'clientId')) AS searcher,
      to_char(timestamp, 'YYYY-MM-DD HH24:MI:SS.US') AS timestamp,
      event->>'context' AS context,
      CASE WHEN event->>'position' ~ '^[0-9]+$' THEN (event->>'position')::INTEGER END AS position
    FROM raw
    WHERE environment = $(environment)
      AND event_type = 'searchResultSelected'
      AND event->>'context' IN ($(contexts:csv))
      AND timestamp >= $(since)
      AND COALESCE(event->>'query', '') <> ''
      AND COALESCE(event->>'resultId', '') <> ''
      AND COALESCE(event->>'userId', event->>'clientId') IS NOT NULL
  `, {environment, since, contexts: clickContexts});
}

/** Resolve clicked targets that are still present and searchable in the frozen corpus. */
async function lookupClickTargets(client: Client, corpus: FrozenCorpus, keys: string[]): Promise<Map<string, ClickTarget>> {
  const targets = new Map<string, ClickTarget>();
  for (const index of allIndexes) {
    const ids = keys.filter(key => key.startsWith(`${index}:`)).map(key => key.slice(index.length + 1));
    for (let start = 0; start < ids.length; start += lookupChunk) {
      const chunk = ids.slice(start, start + lookupChunk);
      const response = await client.search<SearchDocument>({
        index: corpus.indexes[index].name, size: chunk.length, timeout: "10s",
        query: {bool: {should: [], filter: [...(indexNameToConfig(index).filters ?? []), {terms: {objectID: chunk}}]}},
      });
      for (const hit of response.hits.hits) {
        const summary = toRunHit({...hit, _index: index});
        targets.set(summary.key, {index, title: summary.title});
      }
    }
  }
  return targets;
}

/** Rank every clicked query with the code this REPL loaded, keyed by normalized query. */
async function rankClickedSearches(executor: SearchExecutor, clicked: ClickedSearch[]): Promise<Map<string, RunHit[]>> {
  const ranked = new Map<string, RunHit[]>();
  for (const search of clicked) {
    try {
      ranked.set(search.normalized, await searchFrozen(executor, search.text));
    } catch (error) {
      console.log(`Ranking failed for one query: ${error instanceof Error ? error.message.slice(0, 200) : String(error)}`);
    }
    if (ranked.size % 100 === 0) console.log(`Ranked ${ranked.size}/${clicked.length}`);
  }
  return ranked;
}

function csvCell(value: string | number | boolean | null): string {
  const text = value === null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeClickReport(out: string, rows: ClickReportRow[]) {
  fs.mkdirSync(path.dirname(out), {recursive: true});
  writeJson(`${out}.json`, rows);
  const columns: (keyof ClickReportRow)[] = ["query", "category", "target", "title", "searchable", "targetSearchers", "querySearchers", "productionTypeRank", "productionHeaderRank", "branchRank", "branchTypeRank"];
  const lines = [columns.join(","), ...rows.map(row => columns.map(column => csvCell(row[column])).join(","))];
  fs.writeFileSync(`${out}.csv`, lines.join("\n") + "\n");
}

function formatRates(rates: HitRates) {
  const percent = (value: number) => `${Math.round(value * 100)}%`;
  return {pairs: rates.pairs, "@1": percent(rates.at1), "@3": percent(rates.at3), "@10": percent(rates.at10)};
}

interface ClickImportOptions {
  /** ISO date; defaults to one year ago. Clicks have only been recorded since 2026-04-17. */
  since?: string;
  /** Distinct searchers who must have settled on a target before it is imported. */
  minSearchers?: number;
  dryRun?: boolean;
  /** Report path without extension; `.csv` and `.json` are written. */
  out?: string;
}

/**
 * Import production search clicks as graded queries: each searcher's last click
 * for a query is the result they wanted. A target is only imported once at
 * least `minSearchers` distinct people settled on it, because the golden set is
 * committed to a public repository. Dry run by default; either way, a report of
 * every query and target is written with where production showed the target
 * and where the current code ranks it.
 */
export async function importClickedSearches({since, ...options}: ClickImportOptions = {}) {
  const from = since ?? new Date(Date.now() - (365 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10);
  const clicks = await fetchSearchClicks(clickEnvironment, from);
  console.log(`Clicks since ${from}: ${clicks.length}`);
  return applyClickImport(clicks, options);
}

/** The import after fetching, for click events obtained some other way. */
export async function applyClickImport(clicks: SearchClick[], {minSearchers = 3, dryRun = true, out = "/tmp/forum-search-report/click-import"}: Omit<ClickImportOptions, "since"> = {}) {
  const client = evaluationClient();
  const corpus = readCorpus();
  const clicked = aggregateClicks(clicks, minSearchers);
  const keys = [...new Set(clicked.flatMap(search => search.targets.map(target => target.key)))];
  const targets = await lookupClickTargets(client, corpus, keys);
  const rows = clickReport(clicked, targets, await rankClickedSearches(frozenExecutor(client, corpus), clicked));
  writeClickReport(out, rows);

  const searchable = rows.filter(row => row.searchable);
  const fromHeader = searchable.filter(row => row.productionHeaderRank !== null);
  const withTypeRank = searchable.filter(row => row.productionTypeRank !== null);
  console.log(`Query-target pairs chosen by >= ${minSearchers} searchers: ${rows.length} across ${clicked.length} queries; searchable in corpus ${corpus.tag}: ${searchable.length}`);
  console.table({
    "production header (master, flattened)": formatRates(hitRates(fromHeader, row => row.productionHeaderRank)),
    "branch, same pairs": formatRates(hitRates(fromHeader, row => row.branchRank)),
    "production rank within type": formatRates(hitRates(withTypeRank, row => row.productionTypeRank)),
    "branch rank within type, same pairs": formatRates(hitRates(withTypeRank, row => row.branchTypeRank)),
    "branch, all searchable pairs": formatRates(hitRates(searchable, row => row.branchRank)),
  });
  const misses = searchable.filter(row => row.branchRank === null || row.branchRank > 10).sort((a, b) => b.targetSearchers - a.targetSearchers);
  console.log(`Branch misses (target outside the top 10): ${misses.length}`);
  console.table(misses.slice(0, 25).map(row => ({query: row.query, title: row.title.slice(0, 50), searchers: row.targetSearchers, production: row.productionHeaderRank ?? row.productionTypeRank, branch: row.branchRank ?? "-"})));
  console.log(`Full report: ${out}.csv and ${out}.json`);

  const {golden, summary} = mergeClickedSearches(readGoldenSet(), clicked, targets, new Date().toISOString().slice(0, 10));
  if (dryRun) {
    console.log(`Dry run: would add ${summary.added}, refresh ${summary.refreshed}, enrich ${summary.enriched}, skip ${summary.skippedNoTarget} without a searchable target. Pass {dryRun: false} to write goldenSet.json.`);
  } else {
    writeGoldenSet(golden);
    console.log(`Wrote goldenSet.json: ${summary.added} added, ${summary.refreshed} refreshed, ${summary.enriched} enriched, ${summary.skippedNoTarget} skipped without a searchable target`);
  }
  return summary;
}

interface ClickEvaluationOptions {
  /** A click-import report; its `branchRank` column is the "before" ranking. */
  report?: string;
  category?: string;
  concurrency?: number;
  out?: string;
}

interface EvaluatedClickRow extends ClickReportRow {
  before: number | null;
  after: number | null;
}

function weightedShare(rows: EvaluatedClickRow[], rank: (row: EvaluatedClickRow) => number | null, limit: number): string {
  const total = rows.reduce((sum, row) => sum + row.targetSearchers, 0);
  const hit = rows.reduce((sum, row) => {
    const value = rank(row);
    return sum + (value !== null && value <= limit ? row.targetSearchers : 0);
  }, 0);
  return total ? `${Math.round(100 * hit / total)}%` : "-";
}

function clickSummary(rows: EvaluatedClickRow[]) {
  return {
    pairs: rows.length,
    "before @1": weightedShare(rows, row => row.before, 1), "after @1": weightedShare(rows, row => row.after, 1),
    "before @3": weightedShare(rows, row => row.before, 3), "after @3": weightedShare(rows, row => row.after, 3),
    "before @10": weightedShare(rows, row => row.before, 10), "after @10": weightedShare(rows, row => row.after, 10),
  };
}

function rankLabel(rank: number | null): string | number {
  return rank ?? "-";
}

/**
 * Re-rank every searchable production click target with the loaded code and
 * compare against the report's earlier branch ranks. Shares are weighted by how
 * many searchers settled on each target.
 */
export async function evaluateClickTargets({report = "/tmp/forum-search-report/click-import.json", category, concurrency = 8, out = "/tmp/forum-search-report/click-evaluation.json"}: ClickEvaluationOptions = {}) {
  const executor = frozenExecutor(evaluationClient(), readCorpus());
  const rows = readJson<ClickReportRow[]>(report).filter(row => row.searchable && (!category || row.category === category));
  const queries = [...new Set(rows.map(row => row.query))];
  const ranked = new Map<string, string[]>();
  await mapWithConcurrency(queries, concurrency, async query => {
    try {
      ranked.set(query, (await searchFrozen(executor, query)).map(hit => hit.key));
    } catch (error) {
      console.log(`Search failed for one query: ${error instanceof Error ? error.message.slice(0, 200) : String(error)}`);
    }
  });
  const evaluated: EvaluatedClickRow[] = rows.map(row => {
    const position = ranked.get(row.query)?.indexOf(row.target) ?? -1;
    return {...row, before: row.branchRank, after: position < 0 ? null : position + 1};
  });
  writeJson(out, evaluated);
  const categories = [...new Set(evaluated.map(row => row.category))].sort();
  console.table(Object.fromEntries([
    ["all", clickSummary(evaluated)],
    ...categories.map(name => [name, clickSummary(evaluated.filter(row => row.category === name))]),
  ]));
  const missed = (rank: number | null) => rank === null || rank > 10;
  const broken = evaluated.filter(row => !missed(row.before) && missed(row.after)).sort((a, b) => b.targetSearchers - a.targetSearchers);
  const fixed = evaluated.filter(row => missed(row.before) && !missed(row.after));
  const remaining = evaluated.filter(row => missed(row.after)).sort((a, b) => b.targetSearchers - a.targetSearchers);
  console.log(`Fixed ${fixed.length}, broken ${broken.length}, still missed ${remaining.length}`);
  const show = (list: EvaluatedClickRow[]) => console.table(list.slice(0, 20).map(row => ({query: row.query, title: row.title.slice(0, 40), searchers: row.targetSearchers, before: rankLabel(row.before), after: rankLabel(row.after)})));
  if (broken.length) {
    console.log("Newly outside the top 10:");
    show(broken);
  }
  console.log("Still outside the top 10:");
  show(remaining);
  return {fixed: fixed.length, broken: broken.length, remaining: remaining.length};
}

interface Suggestion {
  query: string;
  category: SearchIntentCategory;
  intent: string;
  target: {key: string; title: string};
}

interface SuggestionSource {
  index: string;
  category: SearchIntentCategory;
  titleField: string;
  filter: QueryDslQueryContainer[];
  fragment: boolean;
  intent: string;
}

const suggestionSources: Record<string, SuggestionSource> = {
  "known-item": {index: "posts", category: "known-item", titleField: "title", filter: [{range: {baseScore: {gte: 30}}}], fragment: false, intent: "Find this post by its title"},
  "title-fragment": {index: "posts", category: "known-item", titleField: "title", filter: [{range: {baseScore: {gte: 30}}}], fragment: true, intent: "Find this post from a remembered, unfinished title"},
  "person": {index: "users", category: "person", titleField: "displayName", filter: [{range: {karma: {gte: 500}}}], fragment: false, intent: "Find this person"},
  "concept": {index: "tags", category: "concept", titleField: "name", filter: [{range: {postCount: {gte: 10}}}], fragment: false, intent: "Find this wiki/tag page"},
  "sequence": {index: "sequences", category: "sequence", titleField: "title", filter: [], fragment: false, intent: "Find this sequence"},
};

/** Keep the first half of the words and cut the last kept word short, like a half-typed query. */
function titleFragment(title: string): string | undefined {
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length < 3) return undefined;
  const kept = words.slice(0, Math.ceil(words.length / 2));
  const last = kept[kept.length - 1];
  kept[kept.length - 1] = last.slice(0, Math.max(3, Math.ceil(last.length / 2)));
  return kept.join(" ");
}

async function suggestQueries(client: Client, corpus: FrozenCorpus, kind: string, count: number): Promise<Suggestion[]> {
  const source = suggestionSources[kind];
  if (!source) throw new Error(`Unknown suggestion kind ${kind}`);
  const response = await client.search<Record<string, unknown>>({
    index: corpus.indexes[source.index].name, size: count * 3, timeout: "10s",
    query: {function_score: {
      query: {bool: {should: [], filter: [...(indexNameToConfig(source.index).filters ?? []), ...source.filter]}},
      functions: [{random_score: {seed: Date.now(), field: "_seq_no"}}],
      boost_mode: "replace",
    }},
  });
  const golden = new Set(readGoldenSet().queries.map(query => query.query.toLowerCase()));
  const suggestions: Suggestion[] = [];
  for (const hit of response.hits.hits) {
    const title = hit._source?.[source.titleField];
    if (typeof title !== "string" || !hit._id) continue;
    const text = source.fragment ? titleFragment(title) : title;
    if (!text || golden.has(text.toLowerCase())) continue;
    suggestions.push({query: text, category: source.category, intent: source.intent, target: {key: hitKey(source.index, hit._id), title}});
    if (suggestions.length >= count) break;
  }
  return suggestions;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "query";
}

function uniqueId(golden: GoldenSet, query: string): string {
  const base = slugify(query);
  const ids = new Set(golden.queries.map(existing => existing.id));
  let id = base;
  for (let i = 2; ids.has(id); i++) id = `${base}-${i}`;
  return id;
}

interface QueryInput {
  id?: string;
  query: string;
  category: SearchIntentCategory;
  intent?: string;
  note?: string;
  source?: GoldenQuery["source"];
  grades?: GoldenQuery["grades"];
  expectations?: Expectation[];
}

function upsertQuery(input: QueryInput): GoldenQuery {
  const golden = readGoldenSet();
  const existing = input.id ? golden.queries.find(query => query.id === input.id) : undefined;
  if (!input.query.trim()) throw new Error("Query text is required");
  if (!searchIntentCategories.includes(input.category)) throw new Error(`Unknown category ${input.category}`);
  const query: GoldenQuery = {
    id: existing?.id ?? uniqueId(golden, input.query),
    query: input.query.trim(),
    category: input.category,
    intent: input.intent ?? existing?.intent ?? "",
    ...(input.note ?? existing?.note ? {note: input.note ?? existing?.note} : {}),
    source: existing?.source ?? input.source ?? "annoyance",
    addedAt: existing?.addedAt ?? new Date().toISOString().slice(0, 10),
    grades: input.grades ?? existing?.grades ?? {},
    expectations: input.expectations ?? existing?.expectations ?? [],
    ...(existing?.evidence ? {evidence: existing.evidence} : {}),
  };
  golden.queries = existing ? golden.queries.map(other => other.id === query.id ? query : other) : [...golden.queries, query];
  writeGoldenSet(golden);
  return query;
}

/** Note something that annoys you about search without opening the viewer. */
export function addSearchAnnoyance(query: string, note: string, category: SearchIntentCategory = "topic") {
  return upsertQuery({query, note, category, source: "annoyance"});
}

function setGrade(queryId: string, key: string, grade: Grade | null, title: string) {
  const golden = readGoldenSet();
  const query = golden.queries.find(existing => existing.id === queryId);
  if (!query) throw new Error(`Unknown query ${queryId}`);
  if (grade === null) delete query.grades[key];
  else query.grades[key] = {grade, title};
  writeGoldenSet(golden);
  return query;
}

function deleteQuery(queryId: string) {
  const golden = readGoldenSet();
  golden.queries = golden.queries.filter(query => query.id !== queryId);
  writeGoldenSet(golden);
}

function readBody(request: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", chunk => { body += chunk; });
    request.on("end", () => {
      try {
        const parsed: unknown = body ? JSON.parse(body) : {};
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("Expected a JSON object");
        resolve(Object.fromEntries(Object.entries(parsed)));
      } catch (error) { reject(error); }
    });
    request.on("error", reject);
  });
}

function stringField(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  if (typeof value !== "string") throw new Error(`Expected string field ${field}`);
  return value;
}

function optionalString(body: Record<string, unknown>, field: string): string | undefined {
  return body[field] === undefined ? undefined : stringField(body, field);
}

function parseGrade(value: unknown): Grade | null {
  if (value === null) return null;
  if (value === 0 || value === 1 || value === 2 || value === 3) return value;
  throw new Error("Grade must be 0-3 or null");
}

function parseCategory(value: unknown): SearchIntentCategory {
  const category = searchIntentCategories.find(known => known === value);
  if (!category) throw new Error(`Unknown category ${String(value)}`);
  return category;
}

function parseExpectation(value: unknown): Expectation {
  if (typeof value !== "object" || value === null) throw new Error("Invalid expectation");
  const fields: Record<string, unknown> = Object.fromEntries(Object.entries(value));
  const kind = fields.kind;
  if (kind === "above") return {kind, preferred: stringField(fields, "preferred"), over: stringField(fields, "over")};
  if ((kind === "within" || kind === "absent") && typeof fields.rank === "number") return {kind, target: stringField(fields, "target"), rank: fields.rank};
  throw new Error("Invalid expectation");
}

function parseGrades(value: unknown): GoldenQuery["grades"] | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "object" || value === null) throw new Error("Invalid grades");
  return Object.fromEntries(Object.entries(value).map(([key, graded]) => {
    if (typeof graded !== "object" || graded === null) throw new Error("Invalid grade entry");
    const fields: Record<string, unknown> = Object.fromEntries(Object.entries(graded));
    const grade = parseGrade(fields.grade);
    if (grade === null) throw new Error("Stored grades cannot be null");
    return [key, {grade, title: stringField(fields, "title")}];
  }));
}

function parseQueryInput(body: Record<string, unknown>): QueryInput {
  return {
    id: optionalString(body, "id"),
    query: stringField(body, "query"),
    category: parseCategory(body.category),
    intent: optionalString(body, "intent"),
    note: optionalString(body, "note"),
    source: body.source === "suggested" ? "suggested" : undefined,
    grades: parseGrades(body.grades),
    expectations: Array.isArray(body.expectations) ? body.expectations.map(parseExpectation) : undefined,
  };
}

function sendJson(response: http.ServerResponse, status: number, value: unknown) {
  response.writeHead(status, {"content-type": "application/json"});
  response.end(JSON.stringify(value));
}

async function handleApi(client: Client, request: http.IncomingMessage, url: URL): Promise<unknown> {
  const route = `${request.method} ${url.pathname}`;
  switch (route) {
    case "GET /api/state": {
      const corpus = fs.existsSync(corpusPath) ? readCorpus() : null;
      const runs = listRuns().map(name => {
        const run = readRun(name);
        return {name, createdAt: run.createdAt, gitHead: run.gitHead, dirty: run.dirty, corpusTag: run.corpusTag, queries: run.entries.length};
      });
      return {golden: readGoldenSet(), corpus, runs, code: loadedCode, categories: searchIntentCategories};
    }
    case "GET /api/code": {
      return loadedCode;
    }
    case "GET /api/compare": {
      const baseline = url.searchParams.get("baseline");
      const candidate = url.searchParams.get("candidate");
      if (!baseline || !candidate) throw new Error("baseline and candidate are required");
      return compareRuns(readGoldenSet(), readRun(baseline), readRun(candidate));
    }
    case "POST /api/runs": {
      return runGoldenSet(optionalString(await readBody(request), "label") ?? "");
    }
    case "POST /api/search": {
      const query = stringField(await readBody(request), "query");
      const started = performance.now();
      const hits = await searchFrozen(frozenExecutor(client, readCorpus()), query);
      return {hits, elapsedMs: performance.now() - started};
    }
    case "POST /api/queries":
      return upsertQuery(parseQueryInput(await readBody(request)));
    case "POST /api/grade": {
      const body = await readBody(request);
      return setGrade(stringField(body, "queryId"), stringField(body, "key"), parseGrade(body.grade), stringField(body, "title"));
    }
    case "POST /api/delete": {
      const queryId = stringField(await readBody(request), "queryId");
      deleteQuery(queryId);
      return {deleted: queryId};
    }
    case "GET /api/suggest": {
      const kind = url.searchParams.get("kind") ?? "known-item";
      return suggestQueries(client, readCorpus(), kind, Number(url.searchParams.get("count") ?? 5));
    }
    default:
      throw new Error(`Unknown route ${route}`);
  }
}

/** Exit code asking `serveSearchBaseline.sh` to start a fresh process with the changed code. */
const restartExitCode = 75;
const watchedCode = ["packages/lesswrong/server/search", "packages/lesswrong/server/scripts"];

function exitOnCodeChange() {
  let timer: NodeJS.Timeout | undefined;
  for (const directory of watchedCode) {
    fs.watch(directory, {recursive: true}, (_event, file) => {
      if (!file || !/\.ts$/.test(file) || (directory.endsWith("scripts") && !file.startsWith("searchBaseline"))) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        console.log(`${file} changed; restarting with the new code`);
        process.exit(restartExitCode);
      }, 300);
    });
  }
}

/**
 * Serve the interactive baseline viewer on localhost. Ranking code is whatever
 * this process loaded; with `watch`, the process exits when search code changes
 * so that `serveSearchBaseline.sh` restarts it with the new code.
 */
export function serveSearchBaseline(port = 4111, watch = false): Promise<void> {
  const client = evaluationClient();
  const server = http.createServer((request, response) => {
    const url = new URL(request.url ?? "/", `http://localhost:${port}`);
    if (!url.pathname.startsWith("/api/")) {
      response.writeHead(200, {"content-type": "text/html; charset=utf-8"});
      response.end(fs.readFileSync(viewerPath));
      return;
    }
    handleApi(client, request, url).then(
      value => sendJson(response, 200, value),
      error => sendJson(response, 400, {error: error instanceof Error ? error.message : String(error)}),
    );
  });
  // Recording a run over a large golden set takes minutes.
  server.requestTimeout = 0;
  if (watch) exitOnCodeChange();
  return new Promise(resolve => {
    server.listen(port, "127.0.0.1", () => console.log(`Search baseline viewer: http://localhost:${port} (code ${loadedCode.head}${loadedCode.dirty ? " + uncommitted search changes" : ""})`));
    process.once("SIGINT", () => server.close(() => resolve()));
  });
}
