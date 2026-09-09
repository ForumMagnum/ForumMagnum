import { compileMultiQuery } from "../server/search/elastic/ElasticMultiQuery";
import ElasticQuery from "../server/search/elastic/ElasticQuery";
import ElasticService from "../server/search/elastic/ElasticService";
import ElasticClient from "../server/search/elastic/ElasticClient";

jest.mock("../server/search/elastic/ElasticClient");

it("paginates one globally ranked request with default and caller filters", () => {
  const request = compileMultiQuery({
    indexes: ["posts", "users", "tags"], search: "alignment", offset: 20, limit: 20,
    filters: [{type: "facet", field: "af", value: true, negated: false}],
  });
  expect(request).toMatchObject({
    index: ["posts", "users", "tags"], from: 20, size: 20,
    search_type: "dfs_query_then_fetch", track_total_hits: true,
    sort: [{_score: {order: "desc"}}, {objectID: "asc"}, {_index: "asc"}],
  });
  const encoded = JSON.stringify(request);
  expect(encoded).toContain('"script_score"');
  expect(encoded).toContain('"karmaField":"baseScore"');
  expect(encoded).toContain('"karmaField":"karma"');
  expect(encoded).not.toContain('"aggs"');
  expect(encoded).toContain('"draft":false');
  expect(encoded).toContain('"deleteContent":false');
  expect(encoded).toContain('"adminOnly":false');
  for (const indexQuery of request.query?.dis_max?.queries ?? []) {
    const rankQueries = indexQuery.bool?.must;
    expect(JSON.stringify(rankQueries)).toContain('"af":true');
  }
  expect(request._source).toMatchObject({excludes: expect.arrayContaining(["deleteContent", "unlisted", "exportedAt"])});
});

it("uses common boosts while preserving advanced query syntax", () => {
  for (const index of ["posts", "users", "tags", "comments", "sequences"]) {
    const request = new ElasticQuery({index, search: "alignment", filters: [], unifiedRanking: true}).compile();
    const encoded = JSON.stringify(request.body.query);
    expect(encoded).toContain('"boost":10');
    expect(encoded).toContain('"boost":20');
    expect(encoded).not.toContain('"boost":1000');
    expect(request.body.query.script_score.script.source).toBe("_score");
  }
  const advanced = JSON.stringify(compileMultiQuery({indexes: ["posts", "comments"], search: '"AI safety" -robots user:alice'}));
  expect(advanced).toContain('"AI safety"');
  expect(advanced).toContain('"must_not"');
  expect(advanced).toContain('"authorSlug.sort"');
});

it("forwards pagination and filters and returns global totals and highlights", async () => {
  const client = new ElasticClient();
  jest.spyOn(client, "multiSearch").mockResolvedValue({hits: {
    total: {value: 83, relation: "eq"},
    hits: [{_index: "posts_123", _id: "post1", _source: {_id: "post1", objectID: "post1", title: "AI"}, highlight: {title: ["<em>AI</em>"]}}],
  }});
  const result = await new ElasticService(client).runQuery({indexName: "posts,users", params: {
    query: "AI", page: 2, hitsPerPage: 20, facetFilters: [["af:true"]],
  }}, {emptyStringSearchResults: "default"});
  expect(client.multiSearch).toHaveBeenCalledWith(expect.objectContaining({
    indexes: ["posts", "users"], offset: 40, limit: 20,
    filters: [{type: "facet", field: "af", value: true, negated: false}],
  }));
  expect(result).toMatchObject({nbHits: 83, nbPages: 5, page: 2, hits: [{
    _id: "post1", _index: "posts", _highlightResult: {title: {value: "<em>AI</em>", matchLevel: "full"}},
  }]});
  await new ElasticService(client).runQuery({indexName: "posts", params: {query: "AI"}}, {
    emptyStringSearchResults: "default", unifiedSearch: true,
  });
  expect(client.multiSearch).toHaveBeenLastCalledWith(expect.objectContaining({indexes: ["posts"]}));
});
