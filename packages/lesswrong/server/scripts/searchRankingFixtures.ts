/* eslint-disable no-console */
import fs from "fs";
import type { Client } from "@elastic/elasticsearch";
import type { SearchRequest } from "@elastic/elasticsearch/lib/api/types";
import { compileMultiQuery } from "../search/elastic/ElasticMultiQuery";
import { compilePersonLookup, resolvePersonSearch, PersonCandidate } from "../search/elastic/ElasticPersonSearch";
import { rankingWeights } from "../search/elastic/ElasticAdditiveRanking";
import type { MultiQueryData } from "../search/elastic/unifiedSearchTypes";
import { evaluationClient, summarizeHit } from "./searchRankingEval";

interface FixtureDocument { index: string; fields: Record<string, string | number | boolean | string[]> }
interface FixtureCase { name: string; search: string; preferred: string; over?: string; within?: number; filters?: MultiQueryData["filters"] }
const indexes = ["posts", "comments", "users", "tags", "sequences"];
const filler = "An unrelated account of gardening travel music recipes weather and architecture. ";
function doc(index: string, objectID: string, title: string, body: string, baseScore: number, extra: FixtureDocument["fields"] = {}): FixtureDocument {
  return {index, fields: {
    objectID, title, body, baseScore, userId: "unrelatedauthor01", authorDisplayName: "Other Writer", publicDateMs: 1700000000000,
    isFuture: false, draft: false, rejected: false, authorIsUnreviewed: false, unlisted: false, status: 2,
    deleted: false, deleteContent: false, retracted: false, spam: false, isDeleted: false, hidden: false,
    isPlaceholderPage: false, adminOnly: false, ...extra,
  }};
}

function fixtureDocuments(padding: number): FixtureDocument[] {
  const now = Date.now();
  return [
    doc("posts", "popularbody000001", "Reliable experiments", "Lab automation improves experimental throughput. Lab automation includes robotic pipetting and automated assays. " + filler.repeat(padding), 300),
    doc("posts", "weaktitle00000001", "Lab automation links", "A brief collection of miscellaneous bookmarks.", 0),
    doc("posts", "modestrelevant001", "Cryogenic storage practice", "Freezing sperm preserves fertility. Freezing sperm requires screening, collection, laboratory preparation and long term storage. " + filler.repeat(padding), 20),
    doc("posts", "hugedistractor001", "An unrelated annual journal", filler.repeat(150) + " A visitor mentioned freezing sperm once. " + filler.repeat(150), 1000000),
    doc("posts", "distinctivetitle1", "A Pragmatic Vision for Interpretability", "An introduction to interpretability research.", 0),
    doc("posts", "distinctivebody01", "Popular unrelated anthology", filler.repeat(50) + " A Pragmatic Vision for Interpretability. " + filler.repeat(50), 1000000),
    doc("posts", "genericexact0001", "History", "A short personal note.", 0),
    doc("posts", "genericsubstance1", "Learning from the past", "History teaches us about institutions. History compares evidence and explores causation. " + filler.repeat(padding), 1000),
    doc("comments", "excellentcomment1", "", "Memory retrieval depends on contextual cues. Memory retrieval benefits from spaced recall and elaborative encoding. " + filler.repeat(padding), 300),
    doc("posts", "weakmemorypost001", "Memory retrieval links", "Some links to read later.", 0),
    doc("users", "pnFbJAtNHGDK8PHQx", "", "", 0, {displayName: "AnnaSalamon", slug: "annasalamon", karma: 21291}),
    doc("users", "mirapatel00000001", "", "", 0, {displayName: "miraspatel", karma: 12000}),
    doc("users", "mirataylor0000001", "", "", 0, {displayName: "Mira Taylor", karma: 100000}),
    doc("users", "annasmith00000001", "", "", 0, {displayName: "Anna Smith", karma: 5000}),
    doc("users", "annajones00000001", "", "", 0, {displayName: "Anna Jones", karma: 100000}),
    doc("users", "MEu8MdhruX5jfGsFQ", "", "", 0, {displayName: "johnswentworth", slug: "johnswentworth", karma: 64994}),
    doc("users", "johnsmith00000001", "", "", 0, {displayName: "John Smith", karma: 5000}),
    doc("users", "johnwesley0000001", "", "", 0, {displayName: "John Wesley", karma: 10000}),
    doc("users", "johndoe000000001", "", "", 0, {displayName: "John Doe", karma: 20000}),
    doc("users", "establishedpaul01", "", "", 0, {displayName: "Paul Example", fullName: "Paul Example", slug: "paul-example", karma: 10000}),
    doc("users", "minorpaul00000001", "", "", 0, {displayName: "Paul", slug: "paul", karma: 0}),
    doc("posts", "authoredclassic1", "A careful account of agency", "Agency requires planning and evaluation. ", 1000, {userId: "establishedpaul01", authorDisplayName: "Paul Example"}),
    doc("sequences", "relatedsequence1", "Collected notes", "", 0, {plaintextDescription: "Some notes", collectedAuthorIds: ["establishedpaul01"], authorDisplayName: "Other Writer"}),
    doc("sequences", "relatedsequence2", "Collected links", "", 0, {plaintextDescription: "Some links", collectedAuthorIds: ["establishedpaul01"], authorDisplayName: "Other Writer"}),
    doc("posts", "upcomingevent001", "Rationality meetup", "A rationality meetup for conversation.", 10, {isEvent: true, startTime: new Date(now + 86400000).toISOString()}),
    doc("posts", "pastevent0000001", "Rationality meetup", "A rationality meetup for conversation.", 10, {isEvent: true, startTime: new Date(now - 86400000).toISOString()}),
    doc("posts", "infrabayes0000001", "Infra-Bayesianism", "An introduction to this decision theory framework.", 50),
    doc("posts", "denseprefix001", "American College Admissions", "An account of university selection.", 48),
    doc("posts", "prefixdistractor1", "Weather observations", "American cold weather changes travel plans. American cold conditions require preparation.", 100),
    doc("posts", "compoundgeneral1", "Chemical engineering", "Processes for industrial chemistry.", 10),
    doc("posts", "compounddistract1", "Chemical unrelated engineering", "An unrelated notebook.", 1000000),
    doc("posts", "navierstokes00001", "Navier-Stokes equations", "An introduction to fluid dynamics.", 50),
    doc("posts", "identifier0000001", "Identifier navigation document", "A synthetic unique destination.", 5),
    doc("posts", "unicodepost00001", "日本語", "日本語で議論する。", 5),
    doc("posts", "filtereddraft001", "Hidden draft navigation", "Hidden draft navigation", 100000, {draft: true}),
    ...indexes.flatMap(contentType => Array.from({length: 40}, (_, index) => doc(contentType, `filler${String(index).padStart(11, "0")}`, contentType === "posts" && index < 20 ? `Dictionary colla${String.fromCharCode(97 + index)}` : `Unrelated note ${index}`, filler.repeat((index % 10) + 1), index, {displayName: `Other Person ${index}`, karma: index, name: `Unrelated note ${index}`, description: filler.repeat((index % 10) + 1), plaintextDescription: filler.repeat((index % 10) + 1)}))),
  ];
}

export const controlledCases: FixtureCase[] = [
  {name: "compact query with inserted handle character", search: "MiraP", preferred: "mirapatel00000001", within: 1},
  {name: "spaced query with inserted handle character", search: "Mira P", preferred: "mirapatel00000001", within: 1},
  {name: "prominent profile Anna S", search: "Anna S", preferred: "pnFbJAtNHGDK8PHQx", within: 1},
  {name: "prominent profile Anna Sa", search: "Anna Sa", preferred: "pnFbJAtNHGDK8PHQx", within: 1},
  {name: "prominent profile John", search: "John", preferred: "MEu8MdhruX5jfGsFQ", within: 1},
  {name: "prominent profile John W", search: "John W", preferred: "MEu8MdhruX5jfGsFQ", within: 1},
  {name: "prominent profile John We", search: "John We", preferred: "MEu8MdhruX5jfGsFQ", within: 1},
  {name: "popular substantive body beats weak title", search: "lab automation", preferred: "popularbody000001", over: "weaktitle00000001"},
  {name: "modest relevant beats extremely popular passing mention", search: "freezing sperm", preferred: "modestrelevant001", over: "hugedistractor001"},
  {name: "distinctive exact title remains first", search: "A Pragmatic Vision for Interpretability", preferred: "distinctivetitle1", within: 1},
  {name: "generic exact title has no unconditional priority", search: "history", preferred: "genericsubstance1", over: "genericexact0001"},
  {name: "excellent comment beats weak post", search: "memory retrieval", preferred: "excellentcomment1", over: "weakmemorypost001"},
  {name: "established partial name survives minor exact account", search: "paul", preferred: "establishedpaul01", over: "minorpaul00000001"},
  {name: "author's best writing beats first related collection", search: "Paul Example", preferred: "authoredclassic1", over: "relatedsequence1"},
  {name: "author's best writing beats second related collection", search: "Paul Example", preferred: "authoredclassic1", over: "relatedsequence2"},
  {name: "author plus topic", search: "Paul Example agency", preferred: "authoredclassic1", within: 1},
  {name: "upcoming beats equal past meetup", search: "rationality meetup", preferred: "upcomingevent001", over: "pastevent0000001"},
  {name: "Unicode survives analysis", search: "日本語", preferred: "unicodepost00001", within: 1},
  {name: "observed technical misspelling", search: "infrabayesiansism", preferred: "infrabayes0000001", within: 1},
  {name: "prefix survives dense completion dictionary", search: "american coll", preferred: "denseprefix001", over: "prefixdistractor1"},
  {name: "unseen joined compound typo", search: "chemicalenginering", preferred: "compoundgeneral1", within: 1},
  {name: "joined compound without typo", search: "infrabayesianism", preferred: "infrabayes0000001", within: 1},
  {name: "observed hyphenated misspelling", search: "navier-strokes", preferred: "navierstokes00001", within: 1},
  {name: "unfinished distinctive title", search: "a pragmatic vision for interp", preferred: "distinctivetitle1", within: 1},
  {name: "distinctive title whitespace", search: " A Pragmatic  Vision for Interpretability ", preferred: "distinctivetitle1", within: 1},
  {name: "title word order variant", search: "pragmatic interpretability vision", preferred: "distinctivetitle1", within: 1},
  {name: "raw identifier navigation", search: "identifier0000001", preferred: "identifier0000001", within: 1},
  {name: "internal URL navigation", search: "https://www.lesswrong.com/posts/identifier0000001", preferred: "identifier0000001", within: 1},
  {name: "quoted phrase preserved", search: '"freezing sperm"', preferred: "modestrelevant001", over: "hugedistractor001"},
];

/** Only the fixture request is rewritten; neither real aliases nor production query generation change. */
export function fixtureRequest(request: SearchRequest, names: Record<string, string>): SearchRequest {
  const serialized = JSON.stringify(request, (key, value: unknown) => {
    if (key === "_index" && typeof value === "string" && names[value]) return names[value];
    return value;
  });
  const rewritten: SearchRequest = JSON.parse(serialized);
  const requested = typeof request.index === "string" ? [request.index] : request.index ?? [];
  rewritten.index = requested.map(index => {
    if (!names[index]) throw new Error("Fixture request attempted an unapproved index");
    return names[index];
  });
  rewritten.timeout = "10s";
  rewritten.allow_partial_search_results = false;
  return rewritten;
}

async function fixtureSearch(client: Client, names: Record<string, string>, query: MultiQueryData) {
  const lookup = compilePersonLookup(query.search);
  const candidates = lookup ? await client.search<PersonCandidate>(fixtureRequest(lookup, names)) : undefined;
  if (candidates?.timed_out || candidates?._shards.failed) throw new Error("Incomplete fixture person lookup");
  const person = resolvePersonSearch(query.search, candidates?.hits.hits.flatMap(hit => hit._source ? [hit._source] : []) ?? []);
  const response = await client.search<SearchDocument>(fixtureRequest(compileMultiQuery({...query, person}), names));
  if (response.timed_out || response._shards.failed) throw new Error("Incomplete fixture search");
  return response.hits.hits.map(summarizeHit);
}

/** Creates only uniquely named development fixture indexes and deletes exactly those it created. */
export async function runControlledFixtures(out = "/tmp/forum-search-report/controlled-fixtures.json") {
  const client = evaluationClient();
  const prefix = `ranking-eval-${Date.now()}-`;
  const names: Record<string, string> = Object.fromEntries(indexes.map(index => [index, `${prefix}${index}`]));
  const created: string[] = [];
  const results = [];
  const failures: unknown[] = [];
  try {
    for (const index of indexes) {
      const live = await client.indices.get({index});
      const config = Object.values(live)[0];
      if (!config?.mappings || !config.settings?.index?.analysis) throw new Error("Fixture requires live mappings and analyzers");
      await client.indices.create({index: names[index], mappings: config.mappings, settings: {number_of_shards: 1, number_of_replicas: 0, analysis: config.settings.index.analysis, max_ngram_diff: config.settings.index.max_ngram_diff, max_shingle_diff: config.settings.index.max_shingle_diff}});
      created.push(names[index]);
    }
    for (const padding of [0, 20]) {
      const documents = fixtureDocuments(padding);
      const bulk = await client.bulk({refresh: "wait_for", operations: documents.flatMap(document => [{index: {_index: names[document.index], _id: document.fields.objectID}}, document.fields])});
      if (bulk.errors) throw new Error("Fixture document indexing failed");
      for (const test of controlledCases) {
        const hits = await fixtureSearch(client, names, {ranking: "additive", indexes, search: test.search, filters: test.filters, limit: 20});
        const preferredRank = hits.findIndex(hit => hit.objectID === test.preferred) + 1;
        const otherRank = test.over ? hits.findIndex(hit => hit.objectID === test.over) + 1 : undefined;
        const pass = preferredRank > 0 && (test.within ? preferredRank <= test.within : !!otherRank && preferredRank < otherRank);
        results.push({padding, ...test, preferredRank, otherRank, pass, hits});
        fs.writeFileSync(out, JSON.stringify({status: "running", prefix, weights: rankingWeights, results}, null, 2));
      }
      const page1 = await fixtureSearch(client, names, {ranking: "additive", indexes, search: "Paul Example", limit: 2});
      const page2 = await fixtureSearch(client, names, {ranking: "additive", indexes, search: "Paul Example", offset: 2, limit: 2});
      const full = await fixtureSearch(client, names, {ranking: "additive", indexes, search: "Paul Example", limit: 4});
      results.push({padding, name: "pagination is stable and has no repeated reserved positions", pass: JSON.stringify([...page1, ...page2].map(hit => hit.objectID)) === JSON.stringify(full.map(hit => hit.objectID))});
      const noEventIntent = await fixtureSearch(client, names, {ranking: "additive", indexes, search: "rationality", limit: 10});
      results.push({padding, name: "no freshness bonus without event intent", pass: noEventIntent.find(hit => hit.objectID === "upcomingevent001")?.score === noEventIntent.find(hit => hit.objectID === "pastevent0000001")?.score});
      const hidden = await fixtureSearch(client, names, {ranking: "additive", indexes, search: "Hidden draft navigation", limit: 10});
      results.push({padding, name: "draft eligibility survives strong navigation", pass: !hidden.some(hit => hit.objectID === "filtereddraft001")});
    }
  } catch (error) {
    failures.push(error);
  } finally {
    for (const index of created) {
      if (!index.startsWith(prefix)) {
        failures.push(new Error("Refusing unsafe fixture cleanup"));
        continue;
      }
      try {
        await client.indices.delete({index});
      } catch (error) {
        failures.push(error);
      }
    }
  }
  if (failures.length) throw new AggregateError(failures, "Ranking fixtures or their cleanup failed");
  fs.writeFileSync(out, JSON.stringify({status: "complete", synthetic: true, time: new Date().toISOString(), weights: rankingWeights, deletedFixtureIndexes: created, results}, null, 2));
  console.table(results.map(result => ({padding: result.padding, name: result.name, pass: result.pass})));
  return results;
}
