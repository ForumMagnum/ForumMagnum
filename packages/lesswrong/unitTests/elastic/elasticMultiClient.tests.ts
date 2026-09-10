import { Client } from "@elastic/elasticsearch";
import type { SearchResponse } from "@elastic/elasticsearch/lib/api/types";
import { executeMultiSearch } from "../../server/search/elastic/ElasticClient";

function response(documents: object[], total = documents.length): SearchResponse {
  return {took: 0, timed_out: false, _shards: {total: 1, successful: 1, failed: 0}, hits: {
    total: {value: total, relation: "eq"}, hits: documents.map((document, index) => ({_id: String(index), _index: "test", _source: document})),
  }};
}

afterEach(() => jest.restoreAllMocks());

it("resolves people and reserves sequences before applying the requested page", async () => {
  const client = new Client({node: "http://localhost:9200"});
  const final = response([{objectID: "post"}], 123);
  const search = jest.spyOn(client, "search")
    .mockResolvedValueOnce(response([{objectID: "ey", displayName: "Eliezer Yudkowsky", karma: 10000}]))
    .mockResolvedValueOnce(response([{objectID: "sequence"}]))
    .mockResolvedValueOnce(final);
  const result = await executeMultiSearch(client, {indexes: ["users", "posts", "sequences"], search: "Eliezer", offset: 10, limit: 5});
  expect(result).toBe(final);
  expect(search).toHaveBeenCalledTimes(3);
  expect(search.mock.calls[0][0]).toMatchObject({index: "users"});
  expect(search.mock.calls[1][0]).toMatchObject({index: ["sequences"], from: 0, size: 2});
  expect(search.mock.calls[2][0]).toMatchObject({from: 10, size: 5, track_total_hits: true});
  expect(JSON.stringify(search.mock.calls[2][0])).toContain('"objectID":["sequence"]');
});

it("sends advanced searches directly to the established filtered query", async () => {
  const client = new Client({node: "http://localhost:9200"});
  const search = jest.spyOn(client, "search").mockResolvedValueOnce(response([]));
  await executeMultiSearch(client, {indexes: ["posts"], search: 'user:ey "corrigibility"'});
  expect(search).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(search.mock.calls[0][0])).toContain("authorSlug.sort");
});

it("runs one lookup and one ranked search for the additive ranking, with no sequence pre-query", async () => {
  const client = new Client({node: "http://localhost:9200"});
  const final = response([{objectID: "post"}], 42);
  const search = jest.spyOn(client, "search")
    .mockResolvedValueOnce(response([{objectID: "ey", displayName: "Eliezer Yudkowsky", karma: 10000}]))
    .mockResolvedValueOnce(final);
  const result = await executeMultiSearch(client, {ranking: "additive", indexes: ["users", "posts", "sequences"], search: "Eliezer", offset: 10, limit: 5});
  expect(result).toBe(final);
  expect(search).toHaveBeenCalledTimes(2);
  expect(search.mock.calls[0][0]).toMatchObject({index: "users"});
  expect(search.mock.calls[1][0]).toMatchObject({from: 10, size: 5, track_total_hits: true});
  const serialized = JSON.stringify(search.mock.calls[1][0]);
  expect(serialized).toContain('"function_score"');
  expect(serialized).toContain('"objectID":["ey"]');
  expect(serialized).not.toContain('"tier"');
});

it("fails loudly when any shard failed instead of returning a partial ranking", async () => {
  const client = new Client({node: "http://localhost:9200"});
  const partial = {...response([{objectID: "post"}]), _shards: {total: 5, successful: 4, failed: 1, failures: [{shard: 0, index: "posts", status: "INTERNAL_SERVER_ERROR", reason: {type: "illegal_argument_exception", reason: "bad script"}}]}};
  jest.spyOn(client, "search").mockResolvedValueOnce(response([])).mockResolvedValueOnce(partial);
  await expect(executeMultiSearch(client, {ranking: "additive", indexes: ["posts"], search: "alignment"})).rejects.toThrow(/shard/i);
});

it("rejects a timed-out person lookup before ranking with incomplete author candidates", async () => {
  const client = new Client({node: "http://localhost:9200"});
  const search = jest.spyOn(client, "search").mockResolvedValueOnce({...response([]), timed_out: true});
  await expect(executeMultiSearch(client, {ranking: "additive", indexes: ["posts"], search: "Paul"})).rejects.toThrow(/timed out/i);
  expect(search).toHaveBeenCalledTimes(1);
  expect(search.mock.calls[0][0]).toMatchObject({allow_partial_search_results: false});
});

it("rejects a timed-out final search even when all shards report success", async () => {
  const client = new Client({node: "http://localhost:9200"});
  jest.spyOn(client, "search").mockResolvedValueOnce({...response([{objectID: "partial"}]), timed_out: true});
  await expect(executeMultiSearch(client, {ranking: "additive", indexes: ["posts"], search: '"lab automation"'})).rejects.toThrow(/timed out/i);
});

it("rejects partial sequence selection before reserving positions", async () => {
  const client = new Client({node: "http://localhost:9200"});
  const search = jest.spyOn(client, "search")
    .mockResolvedValueOnce(response([{objectID: "ey", displayName: "Eliezer Yudkowsky", karma: 10000}]))
    .mockResolvedValueOnce({...response([]), _shards: {total: 2, successful: 1, failed: 1}});
  await expect(executeMultiSearch(client, {ranking: "tiered", indexes: ["posts", "sequences"], search: "Eliezer"})).rejects.toThrow(/shard/i);
  expect(search).toHaveBeenCalledTimes(2);
});
