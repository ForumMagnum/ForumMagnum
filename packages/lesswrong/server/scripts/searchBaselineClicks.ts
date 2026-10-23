import { evidenceIndex } from "./searchRankingEvaluationData";
import type { Expectation, GoldenQuery, GoldenSet, RunHit, SearchIntentCategory } from "./searchBaselineMetrics";

/** One `searchResultSelected` analytics event. */
export interface SearchClick {
  query: string;
  resultId: string;
  resultType: string;
  /** `u:<userId>` for logged-in searchers, otherwise `c:<clientId>`. */
  searcher: string;
  timestamp: string;
  context: string;
  /** 1-based rank of the clicked result within its type's list (header bucket or search-page tab). */
  position: number | null;
}

export interface ClickedTarget {
  key: string;
  /** Distinct searchers whose last click for the query was this target. */
  searchers: number;
  /** Rank within its type list when it was clicked, from every final click that recorded one. */
  typeRanks: number[];
  /** Rank in master's flattened header list, for final clicks from the header. */
  headerRanks: number[];
}

export interface ClickedSearch {
  text: string;
  normalized: string;
  searchers: number;
  clicks: number;
  /** Targets chosen by at least the minimum number of searchers, most chosen first. */
  targets: ClickedTarget[];
}

export interface ClickTarget {
  title: string;
  index: string;
}

/** Master's header search: three results per type, in this order. */
const headerBuckets = ["users", "posts", "tags", "comments", "sequences"];
const headerBucketSize = 3;
/** Share of a query's searchers its top target must exceed to become a must-pass expectation. */
const expectationShare = 0.5;
const maxQueryLength = 80;
const internalHosts = /^(https?:\/\/)?(www\.)?(lesswrong\.com|alignmentforum\.org|greaterwrong\.com)(\/|$)/i;

export function normalizeSearchText(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Conservative filter for queries that may identify or expose someone even
 * when several people searched them: emails, handles, long digit runs, external
 * URLs and pasted passages are never imported.
 */
export function looksPrivate(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length > maxQueryLength) return true;
  if (trimmed.includes("@")) return true;
  if (/\d{7,}/.test(trimmed)) return true;
  if (/(token|key|password|secret)=/i.test(trimmed)) return true;
  if (/^(https?:\/\/|www\.)/i.test(trimmed) && !internalHosts.test(trimmed)) return true;
  return false;
}

function mostCommon(values: string[]): string {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function headerRank(index: string, click: SearchClick): number | null {
  const bucket = headerBuckets.indexOf(index);
  if (click.context !== "searchBar" || click.position === null || bucket < 0) return null;
  return (bucket * headerBucketSize) + click.position;
}

function collectTargets(lastClicks: SearchClick[], minSearchers: number): ClickedTarget[] {
  const targets = new Map<string, ClickedTarget>();
  for (const click of lastClicks) {
    const index = evidenceIndex(click.resultType);
    if (!index) continue;
    const key = `${index}:${click.resultId}`;
    const target = targets.get(key) ?? {key, searchers: 0, typeRanks: [], headerRanks: []};
    target.searchers++;
    if (click.position !== null) target.typeRanks.push(click.position);
    const rank = headerRank(index, click);
    if (rank !== null) target.headerRanks.push(rank);
    targets.set(key, target);
  }
  return [...targets.values()]
    .filter(target => target.searchers >= minSearchers)
    .sort((a, b) => b.searchers - a.searchers || a.key.localeCompare(b.key));
}

/**
 * Group clicks by normalized query. Each searcher contributes only their last
 * click for a query, since that is the result they settled on, and a target
 * counts only once at least `minSearchers` distinct people settled on it.
 */
export function aggregateClicks(clicks: SearchClick[], minSearchers: number): ClickedSearch[] {
  const byQuery = new Map<string, SearchClick[]>();
  for (const click of clicks) {
    const normalized = normalizeSearchText(click.query);
    if (!evidenceIndex(click.resultType) || !normalized || !click.resultId || !click.searcher || looksPrivate(click.query)) continue;
    const group = byQuery.get(normalized) ?? [];
    group.push(click);
    byQuery.set(normalized, group);
  }
  const results: ClickedSearch[] = [];
  for (const [normalized, group] of byQuery) {
    const lastBySearcher = new Map<string, SearchClick>();
    for (const click of group) {
      const previous = lastBySearcher.get(click.searcher);
      if (!previous || click.timestamp >= previous.timestamp) lastBySearcher.set(click.searcher, click);
    }
    const targets = collectTargets([...lastBySearcher.values()], minSearchers);
    if (!targets.length) continue;
    results.push({
      text: mostCommon(group.map(click => click.query.trim().replace(/\s+/g, " "))),
      normalized, searchers: lastBySearcher.size, clicks: group.length, targets,
    });
  }
  return results.sort((a, b) => b.targets[0].searchers - a.targets[0].searchers || a.normalized.localeCompare(b.normalized));
}

function words(text: string): string[] {
  return normalizeSearchText(text).replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
}

export function inferCategory(text: string, target: ClickTarget): SearchIntentCategory {
  if (/^[A-Za-z0-9]{17}$/.test(text.trim()) || internalHosts.test(text.trim())) return "navigation";
  switch (target.index) {
    case "users": return "person";
    case "tags": return "concept";
    case "sequences": return "sequence";
    case "comments": return "comment";
  }
  const titleWords = words(target.title);
  const queryWords = words(text);
  const lastWord = queryWords[queryWords.length - 1] ?? "";
  const covered = queryWords.slice(0, -1).every(word => titleWords.includes(word))
    && titleWords.some(word => word.startsWith(lastWord));
  return queryWords.length && covered ? "known-item" : "topic";
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "query";
}

function uniqueId(taken: Set<string>, text: string): string {
  const base = `clicks-${slugify(text)}`;
  let id = base;
  for (let i = 2; taken.has(id); i++) id = `${base}-${i}`;
  return id;
}

function searchableTargets(search: ClickedSearch, targets: Map<string, ClickTarget>): ClickedTarget[] {
  return search.targets.filter(target => targets.has(target.key));
}

function clickGrades(clicked: ClickedTarget[], targets: Map<string, ClickTarget>): GoldenQuery["grades"] {
  return Object.fromEntries(clicked.map(target => [target.key, {grade: 3, title: targets.get(target.key)?.title ?? target.key, clickedBy: target.searchers}]));
}

export interface MergeSummary {
  added: number;
  refreshed: number;
  enriched: number;
  skippedNoTarget: number;
}

/**
 * Merge click-derived queries into the golden set. Imported queries are
 * refreshed on re-import; hand-made queries with the same text only gain grades
 * for results they have not graded and keep their own expectations.
 */
export function mergeClickedSearches(
  golden: GoldenSet,
  clicked: ClickedSearch[],
  targets: Map<string, ClickTarget>,
  importedAt: string,
): {golden: GoldenSet; summary: MergeSummary} {
  const summary: MergeSummary = {added: 0, refreshed: 0, enriched: 0, skippedNoTarget: 0};
  const queries = golden.queries.map(query => ({...query, grades: {...query.grades}}));
  const byText = new Map(queries.map(query => [normalizeSearchText(query.query), query]));
  const taken = new Set(queries.map(query => query.id));
  for (const search of clicked) {
    const searchable = searchableTargets(search, targets);
    if (!searchable.length) {
      summary.skippedNoTarget++;
      continue;
    }
    const [top] = searchable;
    const grades = clickGrades(searchable, targets);
    const expectations: Expectation[] = top.searchers / search.searchers > expectationShare ? [{kind: "within", target: top.key, rank: 3}] : [];
    const evidence = {searchers: search.searchers, clicks: search.clicks};
    const existing = byText.get(search.normalized);
    if (existing && existing.source !== "clicks") {
      for (const [key, graded] of Object.entries(grades)) {
        if (!existing.grades[key]) existing.grades[key] = graded;
      }
      existing.evidence = evidence;
      summary.enriched++;
      continue;
    }
    const topTarget = targets.get(top.key);
    const keptExpectations = (existing?.expectations ?? []).filter(kept => !expectations.some(fresh => JSON.stringify(fresh) === JSON.stringify(kept)));
    const query: GoldenQuery = {
      id: existing?.id ?? uniqueId(taken, search.text),
      query: search.text,
      category: existing?.category ?? (topTarget ? inferCategory(search.text, topTarget) : "topic"),
      intent: `${top.searchers} of ${search.searchers} searchers settled on ${topTarget?.title ?? top.key}`,
      source: "clicks",
      addedAt: existing?.addedAt ?? importedAt,
      // Grades and expectations added by hand in the viewer survive a re-import.
      grades: {...existing?.grades, ...grades},
      expectations: [...keptExpectations, ...expectations],
      evidence,
    };
    if (existing) {
      queries[queries.indexOf(existing)] = query;
      summary.refreshed++;
    } else {
      queries.push(query);
      taken.add(query.id);
      byText.set(search.normalized, query);
      summary.added++;
    }
  }
  return {golden: {...golden, queries}, summary};
}

export interface ClickReportRow {
  query: string;
  category: SearchIntentCategory | "";
  target: string;
  title: string;
  searchable: boolean;
  targetSearchers: number;
  querySearchers: number;
  /** Median rank within the target's type list when people clicked it in production. */
  productionTypeRank: number | null;
  /** Median rank in master's flattened header list, for header clicks. */
  productionHeaderRank: number | null;
  /** Rank in the branch's unified list on the frozen corpus; null if outside the top results. */
  branchRank: number | null;
  /** Rank among results of the same type in the branch's list, comparable to productionTypeRank. */
  branchTypeRank: number | null;
}

/** One row per query and target, so each target's production and branch rank can be compared. */
export function clickReport(clicked: ClickedSearch[], targets: Map<string, ClickTarget>, branchHits: Map<string, RunHit[]>): ClickReportRow[] {
  return clicked.flatMap(search => {
    const hits = branchHits.get(search.normalized);
    const top = searchableTargets(search, targets)[0];
    const topTarget = top && targets.get(top.key);
    const category = topTarget ? inferCategory(search.text, topTarget) : "";
    return search.targets.map(target => {
      const position = hits ? hits.findIndex(hit => hit.key === target.key) : -1;
      const index = target.key.split(":")[0];
      const sameType = hits?.filter(hit => hit.index === index) ?? [];
      const typePosition = sameType.findIndex(hit => hit.key === target.key);
      return {
        query: search.text, category, target: target.key,
        title: targets.get(target.key)?.title ?? "",
        searchable: targets.has(target.key),
        targetSearchers: target.searchers, querySearchers: search.searchers,
        productionTypeRank: median(target.typeRanks),
        productionHeaderRank: median(target.headerRanks),
        branchRank: position < 0 ? null : position + 1,
        branchTypeRank: typePosition < 0 ? null : typePosition + 1,
      };
    });
  });
}

export interface HitRates {
  pairs: number;
  at1: number;
  at3: number;
  at10: number;
}

function shareWithin(rows: ClickReportRow[], rank: (row: ClickReportRow) => number | null, limit: number): number {
  if (!rows.length) return 0;
  return rows.filter(row => {
    const value = rank(row);
    return value !== null && value <= limit;
  }).length / rows.length;
}

/** Share of rows whose rank is within 1, 3 and 10; rows without a rank count as misses. */
export function hitRates(rows: ClickReportRow[], rank: (row: ClickReportRow) => number | null): HitRates {
  return {pairs: rows.length, at1: shareWithin(rows, rank, 1), at3: shareWithin(rows, rank, 3), at10: shareWithin(rows, rank, 10)};
}
