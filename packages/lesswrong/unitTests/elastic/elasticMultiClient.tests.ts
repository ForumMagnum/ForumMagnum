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
