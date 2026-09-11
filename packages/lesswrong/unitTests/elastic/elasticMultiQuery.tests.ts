import { compileMultiQuery } from "../../server/search/elastic/ElasticMultiQuery";
import { compilePersonLookup, resolvePersonSearch } from "../../server/search/elastic/ElasticPersonSearch";

const eliezer = {objectID: "ey", displayName: "Eliezer Yudkowsky", slug: "eliezer-yudkowsky", karma: 10000};

it.each(["tiered", "additive"] as const)("puts curated sequences first before pagination in %s ranking", ranking => {
  const now = jest.spyOn(Date, "now").mockReturnValue(1789160075892);
  const data = {ranking, indexes: ["sequences"], search: "alignment", curatedSequenceIds: ["curated"]};
  const regular = compileMultiQuery({...data, curatedSequenceIds: []});
  const request = compileMultiQuery({...data, offset: 10, limit: 5, sort: [{key: "date", direction: "asc"}]});
  now.mockRestore();
  expect(request.query).toEqual(regular.query);
  expect(request).toMatchObject({from: 10, size: 5});
  expect(request.sort).toEqual([
    {_script: {type: "number", order: "desc", script: {
      source: expect.stringContaining("params.ids.contains(doc['objectID'].value)"),
      params: {ids: ["curated"]},
    }}},
    {publicDateMs: {order: "asc", missing: "_last", unmapped_type: "long"}},
    {objectID: "asc"}, {_index: "asc"},
  ]);
});

it.each(["tiered", "additive"] as const)("does not promote curated sequences in mixed %s results", ranking => {
  const request = compileMultiQuery({ranking, indexes: ["posts", "sequences"], search: "alignment", curatedSequenceIds: ["curated"]});
  expect(request.sort).toEqual([{_score: {order: "desc"}}, {objectID: "asc"}, {_index: "asc"}]);
});

it.each(["tags", "posts", "sequences"])("uses the same karma scale for %s, including empty searches", (index) => {
  const request = compileMultiQuery({ranking: "tiered", indexes: [index], search: ""});
  const branches = request.query?.dis_max?.queries[0]?.bool?.must;
  if (!Array.isArray(branches)) throw new Error("Expected ranked query branches");
  expect(branches[0].dis_max?.queries).toMatchObject([{script_score: {script: {params: {
    tier: 2, karmaField: "baseScore", pivot: 50,
  }}}}]);
});

it("keeps exact and complete wiki name matches above body matches after changing the karma scale", () => {
  const request = compileMultiQuery({ranking: "tiered", indexes: ["tags"], search: "Decision theory"});
  const branches = request.query?.dis_max?.queries[0]?.bool?.must;
  if (!Array.isArray(branches)) throw new Error("Expected ranked query branches");
  expect(branches[0].dis_max?.queries).toMatchObject([2, 4, 5].map(tier => ({script_score: {script: {params: {
    tier, karmaField: "baseScore", pivot: 50,
  }}}})));
});

it("recognizes exact and prominent first names, retains ambiguity, and extracts topics", () => {
  expect(resolvePersonSearch("Eliezer", [eliezer])).toMatchObject({userIds: ["ey"], topic: "", confidence: "strong"});
  expect(resolvePersonSearch("Eliezer corrigibility", [eliezer])).toMatchObject({userIds: ["ey"], topic: "corrigibility", confidence: "strong"});
  expect(resolvePersonSearch("Eliezer", [eliezer, {...eliezer, objectID: "other"}])?.userIds).toMatchObject(["ey", "other"]);
  expect(resolvePersonSearch("Eliezer Yudkowsky", [eliezer])?.topic).toBe("");
  expect(resolvePersonSearch("Elie", [eliezer])).toMatchObject({userIds: ["ey"], topic: "", confidence: "weak"});
  expect(resolvePersonSearch("Eli", [eliezer])).toBeUndefined();
  expect(resolvePersonSearch("Eliezer", [{...eliezer, karma: 2}])).toBeUndefined();
  expect(compilePersonLookup('user:ey "corrigibility"')).toBeUndefined();
});

it("keeps the same ranked query and deterministic tie-breakers across pages", () => {
  const data = {ranking: "tiered" as const, indexes: ["users", "posts", "sequences", "comments"], search: "Eliezer", person: {userIds: ["ey"], topic: "", confidence: "strong" as const}, featuredSequenceIds: ["sequence"]};
  const request = compileMultiQuery(data);
  const secondPage = compileMultiQuery({...data, offset: 3, limit: 3});
  expect(secondPage.query).toEqual(request.query);
  expect(secondPage.from).toBe(3);
  expect(secondPage.size).toBe(3);
  expect(secondPage.track_total_hits).toBe(true);
  expect(secondPage.sort).toEqual([{_score: {order: "desc"}}, {objectID: "asc"}, {_index: "asc"}]);
});

it("preserves advanced filters and disables inferred authorship", () => {
  const request = compileMultiQuery({ranking: "tiered", indexes: ["posts"], search: 'user:ey "corrigibility" -bananas', person: {userIds: ["other"], topic: "", confidence: "exact"}});
  const serialized = JSON.stringify(request.query);
  expect(serialized).toContain('authorSlug.sort');
  expect(serialized).toContain('corrigibility');
  expect(serialized).toContain('bananas');
  expect(serialized).not.toContain('coauthorIds');
});

describe("person resolution confidence", () => {
  const kwa = {objectID: "tk", displayName: "Thomas Kwa", slug: "thomas-kwa", karma: 5000};
  const paul = {objectID: "pc", displayName: "paulfchristiano", slug: "paulfchristiano", karma: 30000};
  const john = {objectID: "jw", displayName: "johnswentworth", slug: "johnswentworth", karma: 40000};
  const minor = {objectID: "mk", displayName: "Minor Kwa", slug: "minor-kwa", karma: 12};

  it("labels exact names, prominent first names, and weak surname, prefix, and fuzzy matches", () => {
    expect(resolvePersonSearch("Eliezer Yudkowsky", [eliezer])).toMatchObject({userIds: ["ey"], topic: "", confidence: "exact"});
    expect(resolvePersonSearch("eliezer-yudkowsky", [eliezer])).toMatchObject({userIds: ["ey"], topic: "", confidence: "exact"});
    expect(resolvePersonSearch("Eliezer", [eliezer])).toMatchObject({userIds: ["ey"], topic: "", confidence: "strong"});
    expect(resolvePersonSearch("kwa", [kwa, minor])).toMatchObject({userIds: ["tk"], topic: "", confidence: "weak"});
    expect(resolvePersonSearch("paulf", [paul])).toMatchObject({userIds: ["pc"], topic: "", confidence: "weak"});
    expect(resolvePersonSearch("johnswentwroth", [john])).toMatchObject({userIds: ["jw"], topic: "", confidence: "weak"});
    expect(resolvePersonSearch("elizer yud", [eliezer])).toMatchObject({userIds: ["ey"], topic: "", confidence: "weak"});
    expect(resolvePersonSearch("kwa connectomics", [kwa])).toMatchObject({userIds: ["tk"], topic: "connectomics", confidence: "weak"});
  });

  it("prefers the most confident reading of the longest span and never infers from minor accounts", () => {
    expect(resolvePersonSearch("kwa", [minor])).toBeUndefined();
    expect(resolvePersonSearch("pau", [paul])).toBeUndefined();
    expect(resolvePersonSearch("Eliezer Yudkowsky", [eliezer, {objectID: "fuzzy", displayName: "Eliezer Yudkowski", slug: "eliezer-yudkowski", karma: 5000}])).toMatchObject({userIds: ["ey"], topic: "", confidence: "exact"});
  });

  it("looks up prefix and fuzzy name candidates only among prominent authors, plus joined-name variants", () => {
    const lookup = JSON.stringify(compilePersonLookup("richard ngo"));
    expect(lookup).toContain('"prefix"');
    expect(lookup).toContain('"slug.sort"');
    expect(lookup).toContain('"fuzziness":"AUTO"');
    expect(lookup).toContain('"karma":{"gte":1000}');
    expect(lookup).toContain('"value":"richard_ngo"');
    expect(lookup).toContain('"value":"richard-ngo"');
    expect(lookup).toContain('"fullName.sort"');
  });

  it("treats a user's full name as an exact alias", () => {
    const evhub = {objectID: "evhub", displayName: "evhub", slug: "evhub", karma: 14000, fullName: "Evan Hubinger"};
    expect(resolvePersonSearch("evan hubinger", [evhub])).toMatchObject({userIds: ["evhub"], topic: "", confidence: "exact"});
    expect(resolvePersonSearch("evan", [evhub])).toMatchObject({userIds: ["evhub"], topic: "", confidence: "strong"});
  });
});

it("sorts by the requested exact keys before the stable tiebreakers", () => {
  const request = compileMultiQuery({ranking: "tiered", indexes: ["posts", "users"], search: "alignment", sort: [{key: "date", direction: "desc"}]});
  expect(request.sort).toEqual([
    {publicDateMs: {order: "desc", missing: "_last", unmapped_type: "long"}},
    {objectID: "asc"}, {_index: "asc"},
  ]);
});


it("retains weaker same-span person interpretations without changing tiered userIds", () => {
  const result = resolvePersonSearch("Paul alignment", [
    {objectID: "minor", displayName: "Paul", karma: 1},
    {objectID: "pc", displayName: "Paul Christiano", karma: 5000},
  ]);
  expect(result).toEqual({userIds: ["minor"], confidence: "exact", topic: "alignment", candidates: [
    {userId: "minor", confidence: "exact"}, {userId: "pc", confidence: "strong"},
  ]});
});


it("resolves misspelled handles even when the display name differs", () => {
  expect(resolvePersonSearch("johnswentwroth", [{objectID: "jw", displayName: "John Wentworth", slug: "johnswentworth", karma: 5000}]))
    .toMatchObject({userIds: ["jw"], confidence: "weak"});
  expect(JSON.stringify(compilePersonLookup("johnswentwroth"))).toContain('"slug.exact"');
});
