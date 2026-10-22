import { aggregateClicks, clickReport, ClickTarget, hitRates, inferCategory, looksPrivate, mergeClickedSearches, SearchClick } from "../../server/scripts/searchBaselineClicks";
import type { GoldenSet, RunHit } from "../../server/scripts/searchBaselineMetrics";

function click(searcher: string, query: string, resultId: string, timestamp: string, {resultType = "Posts", context = "searchBar", position = 1}: {resultType?: string; context?: string; position?: number | null} = {}): SearchClick {
  return {searcher, query, resultId, resultType, timestamp, context, position};
}

function hit(key: string): RunHit {
  const [index, objectID] = key.split(":");
  return {key, index, objectID, title: objectID, karma: 0, score: 0};
}

const targets = new Map<string, ClickTarget>([
  ["posts:wanted", {index: "posts", title: "Hammertime Day 3: TAPs"}],
  ["posts:detour", {index: "posts", title: "Trigger-Action Planning"}],
  ["users:zvi", {index: "users", title: "Zvi"}],
]);

// Four searchers settle on "wanted", three on "detour", one on "rare"; one deleted target.
const clicks = [
  click("c:1", "Hammertime day 3", "detour", "2026-05-01 10:00:00"),
  click("c:1", "hammertime  day 3", "wanted", "2026-05-01 10:01:00", {position: 2}),
  click("c:2", "hammertime day 3", "wanted", "2026-05-02 10:00:00", {position: 2}),
  click("u:3", "hammertime day 3", "wanted", "2026-05-03 10:00:00", {context: "searchPageTabbed", position: 1}),
  click("c:4", "hammertime day 3", "wanted", "2026-05-03 10:00:00", {position: null}),
  ...["c:5", "c:6", "c:7"].map(searcher => click(searcher, "hammertime day 3", "detour", "2026-05-04", {position: 3})),
  click("c:8", "hammertime day 3", "rare", "2026-05-04"),
  ...["c:9", "c:10", "c:11"].map(searcher => click(searcher, "deleted only", "gone", "2026-05-04")),
];

describe("click aggregation", () => {
  it("counts each searcher's last click and keeps targets chosen by enough searchers", () => {
    const [search, gone] = aggregateClicks(clicks, 3);
    expect(search.normalized).toBe("hammertime day 3");
    expect(search.searchers).toBe(8);
    expect(search.clicks).toBe(9);
    expect(search.targets.map(target => [target.key, target.searchers])).toEqual([["posts:wanted", 4], ["posts:detour", 3]]);
    expect(gone.targets.map(target => target.key)).toEqual(["posts:gone"]);
  });

  it("records production ranks within the type and in master's flattened header", () => {
    const [search] = aggregateClicks(clicks, 3);
    const wanted = search.targets[0];
    expect(wanted.typeRanks.sort()).toEqual([1, 2, 2]);
    // Posts are the second header bucket, after three users.
    expect(wanted.headerRanks).toEqual([5, 5]);
  });

  it("never imports queries that could expose someone", () => {
    expect(looksPrivate("alice@example.com")).toBe(true);
    expect(looksPrivate("@alice")).toBe(true);
    expect(looksPrivate("call 5551234567")).toBe(true);
    expect(looksPrivate("https://docs.google.com/document/d/abc")).toBe(true);
    expect(looksPrivate("x".repeat(81))).toBe(true);
    expect(looksPrivate("https://www.lesswrong.com/posts/abc")).toBe(false);
    expect(looksPrivate("zvi")).toBe(false);
    expect(aggregateClicks(["c:1", "c:2", "c:3"].map(searcher => click(searcher, "bob@example.com", "wanted", "2026-05-01")), 3)).toEqual([]);
  });
});

describe("click categories", () => {
  it("infers categories from the chosen target and title coverage", () => {
    expect(inferCategory("zvi", {index: "users", title: "Zvi"})).toBe("person");
    expect(inferCategory("hammertime day 3", {index: "posts", title: "Hammertime Day 3: TAPs"})).toBe("known-item");
    expect(inferCategory("hammertime da", {index: "posts", title: "Hammertime Day 3: TAPs"})).toBe("known-item");
    expect(inferCategory("habit formation", {index: "posts", title: "Hammertime Day 3: TAPs"})).toBe("topic");
    expect(inferCategory("yekQKwmQJNk7thDtQ", {index: "posts", title: "Anything"})).toBe("navigation");
  });
});

describe("click report", () => {
  it("compares where production showed each target with where the branch ranks it", () => {
    const clicked = aggregateClicks(clicks, 3);
    const rows = clickReport(clicked, targets, new Map([["hammertime day 3", [hit("users:zvi"), hit("posts:wanted"), hit("posts:other")]]]));
    const wanted = rows.find(row => row.target === "posts:wanted");
    expect(wanted).toMatchObject({productionTypeRank: 2, productionHeaderRank: 5, branchRank: 2, branchTypeRank: 1, targetSearchers: 4, querySearchers: 8});
    expect(rows.find(row => row.target === "posts:detour")).toMatchObject({branchRank: null, branchTypeRank: null});
    expect(rows.find(row => row.target === "posts:gone")).toMatchObject({searchable: false});
    expect(hitRates(rows.filter(row => row.searchable), row => row.branchRank)).toEqual({pairs: 2, at1: 0, at3: 0.5, at10: 0.5});
  });
});

describe("merging clicked searches", () => {
  const clicked = aggregateClicks(clicks, 3);

  it("grades every well-chosen target, skips unsearchable queries and leaves split choices without expectation", () => {
    const {golden, summary} = mergeClickedSearches({version: 1, queries: []}, clicked, targets, "2026-10-22");
    expect(summary).toEqual({added: 1, refreshed: 0, enriched: 0, skippedNoTarget: 1});
    const [query] = golden.queries;
    expect(query.grades).toEqual({
      "posts:wanted": {grade: 3, title: "Hammertime Day 3: TAPs", clickedBy: 4},
      "posts:detour": {grade: 3, title: "Trigger-Action Planning", clickedBy: 3},
    });
    // Four of eight searchers is not a clear majority.
    expect(query.expectations).toEqual([]);
    expect(query.evidence).toEqual({searchers: 8, clicks: 9});
  });

  it("expects a target that most searchers settled on", () => {
    const majority = aggregateClicks(["c:1", "c:2", "c:3", "c:4"].map(searcher => click(searcher, "zvi", "zvi", "2026-05-01", {resultType: "Users"})), 3);
    const {golden} = mergeClickedSearches({version: 1, queries: []}, majority, targets, "2026-10-22");
    expect(golden.queries[0].expectations).toEqual([{kind: "within", target: "users:zvi", rank: 3}]);
    expect(golden.queries[0].category).toBe("person");
  });

  it("only adds missing grades to a hand-made query with the same text", () => {
    const existing: GoldenSet = {version: 1, queries: [{
      id: "hammertime-day-3", query: "Hammertime day 3", category: "known-item", intent: "", source: "stress-suite", addedAt: "2026-09-10",
      grades: {"posts:detour": {grade: 0, title: "Trigger-Action Planning"}}, expectations: [],
    }]};
    const {golden, summary} = mergeClickedSearches(existing, clicked, targets, "2026-10-22");
    expect(summary.enriched).toBe(1);
    expect(golden.queries[0].source).toBe("stress-suite");
    expect(golden.queries[0].grades["posts:detour"].grade).toBe(0);
    expect(golden.queries[0].grades["posts:wanted"].grade).toBe(3);
  });

  it("keeps hand-added grades and expectations when re-importing", () => {
    const first = mergeClickedSearches({version: 1, queries: []}, clicked, targets, "2026-10-22").golden;
    first.queries[0].grades["posts:other"] = {grade: 1, title: "Other"};
    first.queries[0].expectations.push({kind: "absent", target: "posts:spam", rank: 10});
    const {golden, summary} = mergeClickedSearches(first, clicked, targets, "2026-11-01");
    expect(summary.refreshed).toBe(1);
    expect(golden.queries[0].addedAt).toBe("2026-10-22");
    expect(golden.queries[0].grades["posts:other"].grade).toBe(1);
    expect(golden.queries[0].expectations).toEqual([{kind: "absent", target: "posts:spam", rank: 10}]);
  });
});
