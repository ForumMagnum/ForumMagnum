import { compileMultiQuery } from "../../server/search/elastic/ElasticMultiQuery";
import { compilePersonLookup, resolvePersonSearch } from "../../server/search/elastic/ElasticPersonSearch";

const eliezer = {objectID: "ey", displayName: "Eliezer Yudkowsky", slug: "eliezer-yudkowsky", karma: 10000};

it.each(["tags", "posts", "sequences"])("uses the same karma scale for %s, including empty searches", (index) => {
  const request = compileMultiQuery({indexes: [index], search: ""});
  const branches = request.query?.dis_max?.queries[0]?.bool?.must;
  if (!Array.isArray(branches)) throw new Error("Expected ranked query branches");
  expect(branches[0].dis_max?.queries).toMatchObject([{script_score: {script: {params: {
    tier: 2, karmaField: "baseScore", pivot: 50,
  }}}}]);
});

it("keeps exact and complete wiki name matches above body matches after changing the karma scale", () => {
  const request = compileMultiQuery({indexes: ["tags"], search: "Decision theory"});
  const branches = request.query?.dis_max?.queries[0]?.bool?.must;
  if (!Array.isArray(branches)) throw new Error("Expected ranked query branches");
  expect(branches[0].dis_max?.queries).toMatchObject([2, 4, 5].map(tier => ({script_score: {script: {params: {
    tier, karmaField: "baseScore", pivot: 50,
  }}}})));
});

it("recognizes exact and prominent first names, retains ambiguity, and extracts topics", () => {
  expect(resolvePersonSearch("Eliezer", [eliezer])).toEqual({userIds: ["ey"], topic: ""});
  expect(resolvePersonSearch("Eliezer corrigibility", [eliezer])).toEqual({userIds: ["ey"], topic: "corrigibility"});
  expect(resolvePersonSearch("Eliezer", [eliezer, {...eliezer, objectID: "other"}])?.userIds).toEqual(["ey", "other"]);
  expect(resolvePersonSearch("Eliezer Yudkowsky", [eliezer])?.topic).toBe("");
  expect(resolvePersonSearch("Elie", [eliezer])).toBeUndefined();
  expect(resolvePersonSearch("Eliezer", [{...eliezer, karma: 2}])).toBeUndefined();
  expect(compilePersonLookup('user:ey "corrigibility"')).toBeUndefined();
});

it("keeps the same ranked query and deterministic tie-breakers across pages", () => {
  const data = {indexes: ["users", "posts", "sequences", "comments"], search: "Eliezer", person: {userIds: ["ey"], topic: ""}, featuredSequenceIds: ["sequence"]};
  const request = compileMultiQuery(data);
  const secondPage = compileMultiQuery({...data, offset: 3, limit: 3});
  expect(secondPage.query).toEqual(request.query);
  expect(secondPage.from).toBe(3);
  expect(secondPage.size).toBe(3);
  expect(secondPage.track_total_hits).toBe(true);
  expect(secondPage.sort).toEqual([{_score: {order: "desc"}}, {objectID: "asc"}, {_index: "asc"}]);
});

it("preserves advanced filters and disables inferred authorship", () => {
  const request = compileMultiQuery({indexes: ["posts"], search: 'user:ey "corrigibility" -bananas', person: {userIds: ["other"], topic: ""}});
  const serialized = JSON.stringify(request.query);
  expect(serialized).toContain('authorSlug.sort');
  expect(serialized).toContain('corrigibility');
  expect(serialized).toContain('bananas');
  expect(serialized).not.toContain('coauthorIds');
});
