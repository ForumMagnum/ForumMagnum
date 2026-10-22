export const searchIntentCategories = [
  "person",
  "known-item",
  "concept",
  "topic",
  "author-topic",
  "typo",
  "sequence",
  "comment",
  "event",
  "navigation",
] as const;
export type SearchIntentCategory = typeof searchIntentCategories[number];

/** 0 irrelevant, 1 marginal, 2 relevant, 3 exactly what the searcher wanted. */
export type Grade = 0 | 1 | 2 | 3;

export interface GradedResult {
  grade: Grade;
  title: string;
}

export type Expectation =
  | {kind: "within"; target: string; rank: number}
  | {kind: "absent"; target: string; rank: number}
  | {kind: "above"; preferred: string; over: string};

export interface GoldenQuery {
  id: string;
  query: string;
  category: SearchIntentCategory;
  intent: string;
  /** What currently annoys about this search, if it was added as an annoyance. */
  note?: string;
  source: "annoyance" | "stress-suite" | "judged" | "suggested";
  addedAt: string;
  /** Keyed by `${index}:${objectID}`. */
  grades: Record<string, GradedResult>;
  expectations: Expectation[];
}

export interface GoldenSet {
  version: 1;
  queries: GoldenQuery[];
}

export interface RunHit {
  key: string;
  index: string;
  objectID: string;
  title: string;
  karma: number;
  score: number;
  path?: string;
}

export interface RunEntry {
  queryId: string;
  query: string;
  hits: RunHit[];
  elapsedMs: number;
  error?: string;
}

export interface SearchRun {
  name: string;
  createdAt: string;
  gitHead: string;
  dirty: boolean;
  codeFingerprint: string;
  corpusTag: string;
  weights: unknown;
  entries: RunEntry[];
}

export interface ExpectationResult {
  expectation: Expectation;
  pass: boolean;
}

export interface QueryOutcome {
  missing: boolean;
  error?: string;
  ndcg: number | null;
  unjudgedTop10: number;
  expectations: ExpectationResult[];
  hits: RunHit[];
}

export type Verdict = "win" | "loss" | "tie" | "n/a";

export interface QueryComparison {
  id: string;
  query: string;
  category: SearchIntentCategory;
  baseline: QueryOutcome;
  candidate: QueryOutcome;
  delta: number | null;
  verdict: Verdict;
  expectationChange: "fixed" | "broke" | "same";
}

export interface CategorySummary {
  category: SearchIntentCategory;
  queries: number;
  graded: number;
  compared: number;
  wins: number;
  losses: number;
  meanDelta: number | null;
}

export interface PassCount {
  pass: number;
  total: number;
}

export interface RunComparison {
  baseline: string;
  candidate: string;
  sameCorpus: boolean;
  summary: {
    queries: number;
    compared: number;
    wins: number;
    losses: number;
    ties: number;
    meanBaseline: number | null;
    meanCandidate: number | null;
    meanDelta: number | null;
    deltaInterval: [number, number] | null;
    mustPass: {baseline: PassCount; candidate: PassCount};
    unjudgedTop10: {baseline: number; candidate: number};
    missing: {baseline: number; candidate: number};
  };
  categories: CategorySummary[];
  queries: QueryComparison[];
}

const tieThreshold = 0.005;
const bootstrapResamples = 2000;

export function hitKey(index: string, objectID: string): string {
  return `${index}:${objectID}`;
}

function rankOf(keys: string[], key: string): number | null {
  const position = keys.indexOf(key);
  return position < 0 ? null : position + 1;
}

export function evaluateExpectation(expectation: Expectation, keys: string[]): boolean {
  switch (expectation.kind) {
    case "within": {
      const rank = rankOf(keys, expectation.target);
      return rank !== null && rank <= expectation.rank;
    }
    case "absent": {
      const rank = rankOf(keys, expectation.target);
      return rank === null || rank > expectation.rank;
    }
    case "above": {
      const preferred = rankOf(keys, expectation.preferred);
      const over = rankOf(keys, expectation.over);
      return preferred !== null && (over === null || preferred < over);
    }
  }
}

function dcg(grades: number[]): number {
  return grades.reduce((sum, grade, i) => sum + (((2 ** grade) - 1) / Math.log2(i + 2)), 0);
}

/**
 * Standard nDCG@10 where unjudged results count as irrelevant. Unlike the
 * condensed variant, a target sliding from #1 to #2 lowers the score, which is
 * what a regression baseline needs; unjudged counts are reported separately.
 */
export function ndcgAt10(keys: string[], grades: Map<string, number>): number | null {
  const ideal = dcg([...grades.values()].sort((a, b) => b - a).slice(0, 10));
  return ideal ? dcg(keys.slice(0, 10).map(key => grades.get(key) ?? 0)) / ideal : null;
}

export function queryOutcome(query: GoldenQuery, entry: RunEntry | undefined): QueryOutcome {
  if (!entry || entry.query !== query.query) {
    return {missing: true, ndcg: null, unjudgedTop10: 0, expectations: [], hits: []};
  }
  const keys = entry.hits.map(hit => hit.key);
  const grades = new Map(Object.entries(query.grades).map(([key, graded]) => [key, graded.grade]));
  return {
    missing: false,
    error: entry.error,
    ndcg: entry.error ? null : ndcgAt10(keys, grades),
    unjudgedTop10: keys.slice(0, 10).filter(key => !grades.has(key)).length,
    expectations: query.expectations.map(expectation => ({expectation, pass: !entry.error && evaluateExpectation(expectation, keys)})),
    hits: entry.hits,
  };
}

function mean(values: number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

/** Deterministic PRNG so the same two runs always report the same interval. */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Paired bootstrap 95% interval of the mean per-query delta. */
export function bootstrapInterval(deltas: number[], resamples = bootstrapResamples): [number, number] | null {
  if (deltas.length < 2) return null;
  const random = mulberry32(deltas.length);
  const means: number[] = [];
  for (let i = 0; i < resamples; i++) {
    let sum = 0;
    for (let j = 0; j < deltas.length; j++) sum += deltas[Math.floor(random() * deltas.length)];
    means.push(sum / deltas.length);
  }
  means.sort((a, b) => a - b);
  return [means[Math.floor(resamples * 0.025)], means[Math.floor(resamples * 0.975)]];
}

function passCount(outcomes: QueryOutcome[]): PassCount {
  const results = outcomes.flatMap(outcome => outcome.missing ? [] : outcome.expectations);
  return {pass: results.filter(result => result.pass).length, total: results.length};
}

function expectationChange(baseline: QueryOutcome, candidate: QueryOutcome): QueryComparison["expectationChange"] {
  if (baseline.missing || candidate.missing) return "same";
  const before = baseline.expectations.filter(result => result.pass).length;
  const after = candidate.expectations.filter(result => result.pass).length;
  return after > before ? "fixed" : after < before ? "broke" : "same";
}

function verdictOf(delta: number | null): Verdict {
  if (delta === null) return "n/a";
  if (delta > tieThreshold) return "win";
  if (delta < -tieThreshold) return "loss";
  return "tie";
}

function summarizeCategory(category: SearchIntentCategory, golden: GoldenQuery[], queries: QueryComparison[]): CategorySummary {
  const selected = queries.filter(query => query.category === category);
  const deltas = selected.flatMap(query => query.delta === null ? [] : [query.delta]);
  return {
    category,
    queries: selected.length,
    graded: golden.filter(query => query.category === category && Object.keys(query.grades).length > 0).length,
    compared: deltas.length,
    wins: selected.filter(query => query.verdict === "win").length,
    losses: selected.filter(query => query.verdict === "loss").length,
    meanDelta: mean(deltas),
  };
}

export function compareRuns(golden: GoldenSet, baseline: SearchRun, candidate: SearchRun): RunComparison {
  const baselineEntries = new Map(baseline.entries.map(entry => [entry.queryId, entry]));
  const candidateEntries = new Map(candidate.entries.map(entry => [entry.queryId, entry]));
  const queries: QueryComparison[] = golden.queries.map(query => {
    const before = queryOutcome(query, baselineEntries.get(query.id));
    const after = queryOutcome(query, candidateEntries.get(query.id));
    const delta = before.ndcg !== null && after.ndcg !== null ? after.ndcg - before.ndcg : null;
    return {
      id: query.id, query: query.query, category: query.category,
      baseline: before, candidate: after, delta,
      verdict: verdictOf(delta),
      expectationChange: expectationChange(before, after),
    };
  });
  const compared = queries.filter(query => query.delta !== null);
  const deltas = compared.flatMap(query => query.delta === null ? [] : [query.delta]);
  return {
    baseline: baseline.name,
    candidate: candidate.name,
    sameCorpus: baseline.corpusTag === candidate.corpusTag,
    summary: {
      queries: queries.length,
      compared: compared.length,
      wins: queries.filter(query => query.verdict === "win").length,
      losses: queries.filter(query => query.verdict === "loss").length,
      ties: queries.filter(query => query.verdict === "tie").length,
      meanBaseline: mean(compared.flatMap(query => query.baseline.ndcg === null ? [] : [query.baseline.ndcg])),
      meanCandidate: mean(compared.flatMap(query => query.candidate.ndcg === null ? [] : [query.candidate.ndcg])),
      meanDelta: mean(deltas),
      deltaInterval: bootstrapInterval(deltas),
      mustPass: {baseline: passCount(queries.map(query => query.baseline)), candidate: passCount(queries.map(query => query.candidate))},
      unjudgedTop10: {
        baseline: queries.reduce((sum, query) => sum + query.baseline.unjudgedTop10, 0),
        candidate: queries.reduce((sum, query) => sum + query.candidate.unjudgedTop10, 0),
      },
      missing: {
        baseline: queries.filter(query => query.baseline.missing).length,
        candidate: queries.filter(query => query.candidate.missing).length,
      },
    },
    categories: searchIntentCategories.map(category => summarizeCategory(category, golden.queries, queries)),
    queries,
  };
}

export function validateGoldenSet(golden: GoldenSet): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const query of golden.queries) {
    if (ids.has(query.id)) problems.push(`Duplicate query id ${query.id}`);
    ids.add(query.id);
    if (!query.query.trim()) problems.push(`Empty query text for ${query.id}`);
    if (!searchIntentCategories.includes(query.category)) problems.push(`Unknown category ${query.category} for ${query.id}`);
    for (const [key, graded] of Object.entries(query.grades)) {
      if (!/^(posts|comments|users|tags|sequences):.+$/.test(key)) problems.push(`Malformed result key ${key} for ${query.id}`);
      if (![0, 1, 2, 3].includes(graded.grade)) problems.push(`Invalid grade ${graded.grade} for ${key} in ${query.id}`);
    }
    for (const expectation of query.expectations) {
      if (expectation.kind !== "above" && (!Number.isInteger(expectation.rank) || expectation.rank < 1)) {
        problems.push(`Invalid expectation rank in ${query.id}`);
      }
    }
  }
  return problems;
}
