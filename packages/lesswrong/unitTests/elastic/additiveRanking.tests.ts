import type { PersonSearch } from "../../server/search/elastic/ElasticPersonSearch";
import type { QueryDslQueryContainer } from "@elastic/elasticsearch/lib/api/types";
import { compileMultiQuery } from "../../server/search/elastic/ElasticMultiQuery";
import { compoundTitleQuery, matchPoints, navigationPoints, parseIdentifier, popularityGate, popularityPoints, rankingWeights, wantsUpcomingEvents } from "../../server/search/elastic/ElasticAdditiveRanking";

function interpretations(index: string, search: string, person?: PersonSearch): QueryDslQueryContainer[] {
  const request = compileMultiQuery({ranking: "additive", indexes: [index], search, person});
  const must = request.query?.dis_max?.queries[0]?.bool?.must;
  if (!Array.isArray(must) || !must[0].dis_max) throw new Error("Missing interpretations");
  return must[0].dis_max.queries;
}

function lexicalScore(query: QueryDslQueryContainer): QueryDslQueryContainer {
  const must = query.bool?.must;
  const outer = query.function_score ?? (Array.isArray(must) ? must[0]?.function_score : undefined);
  if (!outer?.query?.function_score) throw new Error("Missing lexical score");
  return outer.query;
}

function outerScore(query: QueryDslQueryContainer) {
  const must = query.bool?.must;
  const outer = query.function_score ?? (Array.isArray(must) ? must[0]?.function_score : undefined);
  if (!outer) throw new Error("Missing outer score");
  return outer;
}

describe("bounded scoring", () => {
  it("lets a substantive popular body match beat a modest title match", () => {
    const body = matchPoints(44, 22) + 1 + 1;
    const title = matchPoints(22, 22) + 1;
    expect(body + (popularityGate(body) * popularityPoints(100, 15))).toBeGreaterThan(title + rankingWeights.match.titleAll + (popularityGate(title) * popularityPoints(5, 15)));
    const passing = matchPoints(5, 22);
    expect(body + (popularityGate(body) * popularityPoints(15, 15))).toBeGreaterThan(passing + (popularityGate(passing) * popularityPoints(100000, 15)));
  });

  it("bounds popularity and uses topical maximum independently of title points", () => {
    expect(popularityPoints(-5, 15)).toBe(0);
    expect(popularityPoints(100000, 15)).toBe(4);
    expect(popularityGate(0)).toBe(0.1);
    expect(popularityGate(rankingWeights.match.topicalMax)).toBe(1);
    expect(popularityGate(100)).toBe(1);
    expect(navigationPoints(1)).toBe(0);
    expect(navigationPoints(4)).toBe(4.5);
  });
});

describe("independent interpretations and topical evidence", () => {
  it("credits unfinished titles without giving complete topic phrases extra navigation", () => {
    const query = interpretations("posts", "american coll")[0];
    const functions = outerScore(query).functions ?? [];
    const navigation = functions.find(fn => fn.weight === navigationPoints(2));
    const serialized = JSON.stringify(navigation?.filter);
    expect(serialized).toContain('"match_phrase_prefix":{"title.exact":{"query":"american coll","max_expansions":50');
    expect(serialized).toContain('"must_not":[{"match_phrase":{"title.exact":{"query":"american coll"');
    const coverage = functions.find(fn => fn.weight === rankingWeights.match.titleAll && JSON.stringify(fn.filter).includes('"title":'));
    expect(JSON.stringify(coverage?.filter)).toContain('"minimum_should_match":1');
    // The phrase-prefix candidate admits the result without increasing the raw
    // lexical query used for BM25 calibration or the popularity gate.
    expect(JSON.stringify(lexicalScore(query).function_score?.query?.bool?.must)).not.toContain("match_phrase_prefix");
  });

  it("preserves meaningful phrase stopwords in computation in", () => {
    const query = interpretations("posts", "computation in")[0];
    const functions = lexicalScore(query).function_score?.functions ?? [];
    const phrase = functions.find(fn => (JSON.stringify(fn.filter) ?? "").includes("match_phrase"));
    expect(JSON.stringify(phrase?.filter)).toContain('"query":"computation in"');
    expect(phrase?.weight).toBe(rankingWeights.match.phrase);
  });

  it("retains Roko topic scoring even when a person is resolved", () => {
    const [query] = interpretations("posts", "roko", {userIds: ["roko-id"], topic: "", confidence: "weak"});
    expect(JSON.stringify(outerScore(query).functions)).toContain('"title.sort":{"value":"roko"');
    const lexical = lexicalScore(query).function_score;
    const must = lexical?.query?.bool?.must;
    expect(JSON.stringify(must)).toContain('"query":"roko"');
    expect(JSON.stringify(must)).not.toContain("userId");
    expect(JSON.stringify(lexical?.functions)).not.toContain('"title":{"query"');
    expect(JSON.stringify(lexical?.query?.bool?.filter)).toContain("coauthorIds");
  });

  it("scores the residual topic only for that author's writing and takes the maximum interpretation", () => {
    const queries = interpretations("posts", "neel nanda interpretability", {userIds: ["nn"], topic: "interpretability", confidence: "exact"});
    expect(queries).toHaveLength(2);
    expect(JSON.stringify(lexicalScore(queries[0]).function_score?.functions)).toContain("neel nanda interpretability");
    expect(JSON.stringify(lexicalScore(queries[1]).function_score?.functions)).toContain('"query":"interpretability"');
    expect(JSON.stringify(lexicalScore(queries[1]).function_score?.query?.bool?.filter)).toContain('"coauthorIds":["nn"]');
    expect(queries[0].bool).toBeUndefined();
    expect(queries[1].bool?.must).toBeDefined();
  });

  it("does not let title, identity, or relationship recall inflate topical BM25", () => {
    const query = interpretations("posts", "lab automation")[0];
    const lexical = lexicalScore(query).function_score;
    expect(lexical?.query?.bool?.must).toEqual([{dis_max: {queries: [
      {multi_match: {query: "lab automation", fields: ["title", "body"], fuzziness: 1, prefix_length: 2, max_expansions: 10, minimum_should_match: "2<75%"}},
      {match_all: {boost: 0}},
    ]}}]);
    expect(JSON.stringify(outerScore(query).functions)).toContain('"title":{"query":"lab automation"');
  });

  it("gives full popularity only to the resolved profiles", () => {
    const query = interpretations("users", "evan", {userIds: ["evhub"], topic: "", confidence: "strong"})[0];
    const functions = outerScore(query).functions ?? [];
    const full = functions.find(fn => JSON.stringify(fn.script_score).includes('"gateFloor":1'));
    expect(full?.filter).toEqual({terms: {objectID: ["evhub"]}});
    const regular = functions.find(fn => JSON.stringify(fn.script_score).includes('"gateFloor":0.1'));
    expect(regular?.filter).toEqual({bool: {should: [], must_not: [{terms: {objectID: ["evhub"]}}]}});
  });

  it("caps ambiguous coauthor relationship credit at the strongest candidate", () => {
    const query = interpretations("posts", "Paul", {userIds: ["minor"], topic: "", confidence: "exact", candidates: [
      {userId: "minor", confidence: "exact"}, {userId: "pc", confidence: "strong"},
    ]})[0];
    const must = query.bool?.must;
    if (!Array.isArray(must)) throw new Error("Missing relationship score");
    expect(must[1].function_score?.score_mode).toBe("max");
    expect(JSON.stringify(must[1])).toContain('"coauthorIds":["pc"]');
  });

  it("preserves advanced syntax eligibility without inferred authors", () => {
    const query = compileMultiQuery({ranking: "additive", indexes: ["posts"], search: 'user:ey "corrigibility" -bananas', person: {userIds: ["other"], topic: "", confidence: "exact"}, filters: [{type: "facet", field: "af", value: true, negated: false}]});
    const serialized = JSON.stringify(query.query);
    expect(serialized).toContain("authorSlug.sort");
    expect(serialized).toContain('"must_not"');
    expect(serialized).toContain("bananas");
    expect(serialized).toContain('"af":true');
    expect(serialized).not.toContain("coauthorIds");
  });
});

describe("identifier navigation", () => {
  it.each([
    ["yekQKwmQJNk7thDtQ", {objectID: "yekQKwmQJNk7thDtQ"}],
    ["/posts/yekQKwmQJNk7thDtQ/title", {objectID: "yekQKwmQJNk7thDtQ", index: "posts"}],
    ["https://www.alignmentforum.org/users/evhub", {slug: "evhub", index: "users"}],
    ["https://lesswrong.com/w/medianworld", {slug: "medianworld", index: "tags"}],
  ])("recognizes %s", (search, expected) => {
    if (typeof search !== "string") throw new Error("Invalid fixture");
    expect(parseIdentifier(search)).toEqual(expected);
  });

  it.each(["https://evil.example/users/evhub", "https://lesswrong.com.evil.example/users/evhub", "//evil.example/users/evhub", "/users/%E0%A4%A", "https://user@lesswrong.com/users/evhub"])("does not navigate for %s", search => {
    expect(parseIdentifier(search)).toBeUndefined();
  });
});

describe("selective freshness", () => {
  it("requires event intent and disables freshness for history and date filters", () => {
    expect(wantsUpcomingEvents("lab automation", [])).toBe(false);
    expect(wantsUpcomingEvents("new york meeting", [])).toBe(true);
    expect(wantsUpcomingEvents("meetup 2024", [])).toBe(false);
    expect(wantsUpcomingEvents("meetup", [{type: "numeric", field: "publicDateMs", op: "gte", value: 0}])).toBe(false);
    expect(wantsUpcomingEvents("berkeley", [{type: "postType", field: "postType", value: ["event"]}])).toBe(true);
  });

  it("only rewards future events and never applies historical penalties", () => {
    const functions = outerScore(interpretations("posts", "meetup")[0]).functions;
    const source = JSON.stringify(functions);
    expect(source).toContain("if (distance >= 0) context += eventWeight * decay");
    expect(source).not.toContain("Math.abs");
    expect(source).toContain('"eventWeight":1');
    expect(JSON.stringify(outerScore(interpretations("posts", "history")[0]).functions)).toContain('"eventWeight":0');
  });
});


describe("bounded compound recovery", () => {
  it("splits long joined terms into adjacent fuzzy title tokens", () => {
    expect(parseIdentifier("infrabayesiansism")).toBeUndefined();
    expect(parseIdentifier("/posts/infrabayesiansism")).toEqual({index: "posts", objectID: "infrabayesiansism"});
    const query = compoundTitleQuery("posts", "infrabayesiansism");
    const alternatives = query?.dis_max?.queries ?? [];
    expect(alternatives).toHaveLength(12);
    expect(JSON.stringify(alternatives)).toContain('"value":"infra"');
    expect(JSON.stringify(alternatives)).toContain('"value":"bayesiansism"');
    expect(alternatives.every(alternative => alternative.span_near?.slop === 0 && alternative.span_near.in_order)).toBe(true);
    expect(JSON.stringify(query)).toContain('"max_expansions":5');
  });
  it("does not expand short words, phrases, long inputs, comments or syntax", () => {
    for (const input of ["history", "infra bayesianism", "a".repeat(25), '"infrabayesiansism"']) {
      expect(compoundTitleQuery("posts", input)).toBeUndefined();
    }
    expect(compoundTitleQuery("comments", "infrabayesiansism")).toBeUndefined();
    expect(JSON.stringify(interpretations("posts", '"infrabayesiansism"'))).not.toContain("span_near");
  });
});


it("gives established user karma more weight without changing content popularity", () => {
  const {pivots, userSlope, userCap} = rankingWeights.popularity;
  const john = popularityPoints(64994, pivots.users, userSlope, userCap);
  const anna = popularityPoints(21291, pivots.users, userSlope, userCap);
  const established = popularityPoints(5000, pivots.users, userSlope, userCap);
  expect(john).toBeGreaterThan(anna);
  expect(anna).toBeGreaterThan(established);
  expect(anna - established).toBeGreaterThan(3);
  expect(popularityPoints(1000000000, pivots.users, userSlope, userCap)).toBe(10);
  expect(popularityPoints(1000000000, pivots.posts)).toBe(4);
});
