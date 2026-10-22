import fs from "fs";
import path from "path";
import { bootstrapInterval, compareRuns, evaluateExpectation, GoldenQuery, GoldenSet, ndcgAt10, queryOutcome, RunEntry, SearchRun, validateGoldenSet } from "../../server/scripts/searchBaselineMetrics";

function hits(...keys: string[]): RunEntry["hits"] {
  return keys.map(key => {
    const [index, objectID] = key.split(":");
    return {key, index, objectID, title: objectID, karma: 0, score: 0};
  });
}

function golden(overrides: Partial<GoldenQuery> = {}): GoldenQuery {
  return {
    id: "q1", query: "lab automation", category: "topic", intent: "", source: "annoyance", addedAt: "2026-10-21",
    grades: {"posts:good": {grade: 3, title: "Good"}, "posts:bad": {grade: 0, title: "Bad"}},
    expectations: [{kind: "within", target: "posts:good", rank: 1}],
    ...overrides,
  };
}

function run(name: string, entries: RunEntry[], corpusTag = "c1"): SearchRun {
  return {name, createdAt: "", gitHead: "", dirty: false, codeFingerprint: "", corpusTag, weights: {}, entries};
}

describe("search baseline expectations", () => {
  it("evaluates within, absent and above expectations against ranked keys", () => {
    const keys = ["posts:a", "posts:b", "posts:c"];
    expect(evaluateExpectation({kind: "within", target: "posts:b", rank: 2}, keys)).toBe(true);
    expect(evaluateExpectation({kind: "within", target: "posts:c", rank: 2}, keys)).toBe(false);
    expect(evaluateExpectation({kind: "absent", target: "posts:a", rank: 3}, keys)).toBe(false);
    expect(evaluateExpectation({kind: "absent", target: "posts:z", rank: 3}, keys)).toBe(true);
    expect(evaluateExpectation({kind: "above", preferred: "posts:a", over: "posts:c"}, keys)).toBe(true);
    expect(evaluateExpectation({kind: "above", preferred: "posts:a", over: "posts:z"}, keys)).toBe(true);
    expect(evaluateExpectation({kind: "above", preferred: "posts:z", over: "posts:a"}, keys)).toBe(false);
  });

  it("treats an entry for edited query text as missing rather than scoring stale results", () => {
    const outcome = queryOutcome(golden(), {queryId: "q1", query: "lab automaton", hits: hits("posts:good"), elapsedMs: 1});
    expect(outcome.missing).toBe(true);
    expect(outcome.expectations).toEqual([]);
  });

  it("fails expectations and drops nDCG for errored entries", () => {
    const outcome = queryOutcome(golden(), {queryId: "q1", query: "lab automation", hits: [], elapsedMs: 1, error: "timeout"});
    expect(outcome.ndcg).toBeNull();
    expect(outcome.expectations[0].pass).toBe(false);
  });

  it("lowers nDCG when a lone target slides below an unjudged result", () => {
    const grades = new Map([["users:target", 3]]);
    expect(ndcgAt10(["users:target", "users:other"], grades)).toBe(1);
    expect(ndcgAt10(["users:other", "users:target"], grades)).toBeLessThan(1);
    expect(ndcgAt10(["users:other"], grades)).toBe(0);
  });

  it("counts unjudged results in the top ten", () => {
    const outcome = queryOutcome(golden(), {queryId: "q1", query: "lab automation", hits: hits("posts:new", "posts:good", "posts:other"), elapsedMs: 1});
    expect(outcome.unjudgedTop10).toBe(2);
  });
});

describe("search baseline comparison", () => {
  it("reports a win, a fixed expectation and per-category movement", () => {
    const set: GoldenSet = {version: 1, queries: [golden()]};
    const before = run("before", [{queryId: "q1", query: "lab automation", hits: hits("posts:bad", "posts:good"), elapsedMs: 1}]);
    const after = run("after", [{queryId: "q1", query: "lab automation", hits: hits("posts:good", "posts:bad"), elapsedMs: 1}]);
    const comparison = compareRuns(set, before, after);
    expect(comparison.queries[0].verdict).toBe("win");
    expect(comparison.queries[0].expectationChange).toBe("fixed");
    expect(comparison.summary.mustPass).toEqual({baseline: {pass: 0, total: 1}, candidate: {pass: 1, total: 1}});
    expect(comparison.categories.find(category => category.category === "topic")?.wins).toBe(1);
  });

  it("flags comparisons across different frozen corpora", () => {
    const set: GoldenSet = {version: 1, queries: []};
    expect(compareRuns(set, run("a", [], "c1"), run("b", [], "c2")).sameCorpus).toBe(false);
  });

  it("produces a deterministic interval that excludes zero for a consistent improvement", () => {
    const deltas = [0.1, 0.2, 0.15, 0.05, 0.12, 0.3, 0.08, 0.1];
    const interval = bootstrapInterval(deltas);
    expect(interval).toEqual(bootstrapInterval(deltas));
    expect(interval?.[0]).toBeGreaterThan(0);
  });
});

describe("committed golden set", () => {
  it("is valid", () => {
    const file = path.join(__dirname, "../../server/scripts/searchBaselineData/goldenSet.json");
    const set: GoldenSet = JSON.parse(fs.readFileSync(file, "utf8"));
    expect(validateGoldenSet(set)).toEqual([]);
  });
});
