import { buildEvaluationGroups, evidenceIndex, navigationMetrics, judgedPoolNdcg, targetKey, EvaluationEvidence, IntentFamily } from "../../server/scripts/searchRankingEvaluationData";

function row(query: string, resultId: string, resultType = "Posts"): EvaluationEvidence {
  return {query, context: "searchBar", resultType, resultId, resultTitle: "", clicks: 1};
}

describe("ranking evaluation evidence", () => {
  it("uses typed identities so equal IDs in different indexes are distinct", () => {
    expect(targetKey({index: "users", objectID: "same"})).not.toBe(targetKey({index: "posts", objectID: "same"}));
    expect(evidenceIndex("Posts")).toBe("posts");
    expect(evidenceIndex("invalid")).toBeUndefined();
  });

  it("puts family variants and shared targets into one deterministic split", () => {
    const families: IntentFamily[] = [
      {id: "intent-01", category: "Find a person", observed_queries: ["Paul", "paulf"], observed_targets: [{result_type: "Users", result_id: "paul"}]},
      {id: "intent-02", category: "Author plus subject", observed_queries: ["Paul agency"], observed_targets: [{result_type: "Posts", result_id: "agency"}]},
    ];
    const rows = [row("Paul", "paul", "Users"), row("paulf", "paul", "Users"), row("Paul agency", "agency"), row("agency", "agency"), row("Paul", "agency")];
    const groups = buildEvaluationGroups(rows, families);
    expect(new Set(groups.map(group => group.family)).size).toBe(1);
    expect(new Set(groups.map(group => group.split)).size).toBe(1);
    expect(groups.find(group => group.query === "paul")?.categories).toEqual(["Find a person"]);
    expect(buildEvaluationGroups([...rows].reverse(), [...families].reverse())).toEqual(groups);
  });

  it("does not connect different collection IDs and normalizes whitespace", () => {
    const groups = buildEvaluationGroups([row("  first   query ", "same"), row("person", "same", "Users")], []);
    expect(groups.map(group => group.query)).toEqual(["first query", "person"]);
    expect(groups[0].family).not.toBe(groups[1].family);
  });

  it("does not label unknown results irrelevant in pooled graded metrics", () => {
    const grades = new Map([["posts:a", 3], ["posts:b", 0]]);
    expect(judgedPoolNdcg(["posts:unknown", "posts:a", "posts:b"], grades)).toBe(1);
    expect(judgedPoolNdcg(["posts:b", "posts:a"], grades)).toBeLessThan(1);
    expect(judgedPoolNdcg([], new Map())).toBeNull();
  });

  it("includes genuine misses in MRR and leaves empty cohorts undefined", () => {
    expect(navigationMetrics([1, 2, null])).toEqual({queries: 3, mrr: 0.5, successAt1: 1 / 3, successAt3: 2 / 3, successAt10: 2 / 3});
    expect(navigationMetrics([]).mrr).toBeNull();
  });
});
