import { compileSearchQuery } from "../../server/search/elastic/ElasticAdditiveRanking";
import ElasticClient from "../../server/search/elastic/ElasticClient";
import ElasticService from "../../server/search/elastic/ElasticService";

jest.mock("../../server/search/elastic/ElasticClient");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ElasticService", () => {
  it("Can parse facet, numeric, and exists filters", () => {
    const service = new ElasticService();
    const result = service.parseFilters(
      [
        ["a:true"],
        ["b:false"],
        ["c:test"],
        ["c:-test"],
      ], [
        "d<3",
        "e<=4",
        "f>5",
        "g>=6",
        "h=7",
      ],
      ['j', 'k']
    );
    expect(result).toStrictEqual([
      {type: "facet", field: "a", value: true, negated: false},
      {type: "facet", field: "b", value: false, negated: false},
      {type: "facet", field: "c", value: "test", negated: false},
      {type: "facet", field: "c", value: "test", negated: true},
      {type: "numeric", field: "d", value: 3, op: "lt"},
      {type: "numeric", field: "e", value: 4, op: "lte"},
      {type: "numeric", field: "f", value: 5, op: "gt"},
      {type: "numeric", field: "g", value: 6, op: "gte"},
      {type: "numeric", field: "h", value: 7, op: "eq"},
      {type: "exists", field: "j"},
      {type: "exists", field: "k"},
    ]);
  });
});

describe("ElasticService ranked requests", () => {
  it("uses additive ranking for ordinary UI requests", async () => {
    const client = new ElasticClient();
    const search = jest.spyOn(client, "search").mockResolvedValue({hits: {total: 0, hits: []}});
    await new ElasticService(client).runQuery({indexName: "posts,comments,users,tags,sequences", params: {query: "John W"}}, {emptyStringSearchResults: "default"});
    const request = search.mock.calls[0][0];
    const compiled = JSON.stringify(compileSearchQuery(request));
    expect(compiled).toContain('"function_score"');
    expect(compiled).not.toContain('"tier"');
  });

  it("forwards the new filters to ordinary search", async () => {
    const client = new ElasticClient();
    jest.spyOn(client, "search").mockResolvedValue({hits: {total: 0, hits: []}});
    const service = new ElasticService(client);
    await service.runQuery({indexName: "posts,users", params: {
      query: "alignment", tagIds: ["t1"], tagMatch: "all", authorIds: ["u1"], postTypes: ["question"],
    }}, {emptyStringSearchResults: "default"});
    expect(client.search).toHaveBeenCalledWith(expect.objectContaining({
      indexes: ["posts", "users"],
      filters: [
        {type: "tag", field: "tags", value: ["t1"], match: "all"},
        {type: "author", field: "author", value: ["u1"]},
        {type: "postType", field: "postType", value: ["question"]},
      ],
    }));
  });

  it("rejects invalid post types", () => {
    const service = new ElasticService();
    expect(() => service.parseFilters(undefined, undefined, undefined, {postTypes: ["poem"]})).toThrow("Invalid post type: poem");
  });
});

it("uses ordinary additive search for a single index without an opt-in", async () => {
  const client = new ElasticClient();
  jest.spyOn(client, "lookup").mockResolvedValue({hits: {total: 0, hits: []}});
  const search = jest.spyOn(client, "search").mockResolvedValue({hits: {total: 0, hits: []}});
  await new ElasticService(client).runQuery({indexName: "posts", params: {query: "alignment", authorIds: ["alice"]}}, {emptyStringSearchResults: "default"});
  expect(search).toHaveBeenCalledWith(expect.objectContaining({
    indexes: ["posts"],
    filters: [{type: "author", field: "author", value: ["alice"]}],
  }));
});

it("preserves specialist lookup pagination, aliases, filters and geographic coordinates", async () => {
  const client = new ElasticClient();
  const lookup = jest.spyOn(client, "lookup").mockResolvedValue({hits: {total: 0, hits: []}});
  await new ElasticService(client).runQuery({indexName: "users_karma", params: {
    query: "Alice", aroundLatLng: "37, -122", page: 2, hitsPerPage: 7,
    facetFilters: [["af:true"]], highlightPreTag: "<em>", highlightPostTag: "</em>",
  }}, {emptyStringSearchResults: "default", mode: "lookup"});
  expect(lookup).toHaveBeenCalledWith({
    index: "users", sorting: "karma", search: "Alice", offset: 14, limit: 7,
    coordinates: [-122, 37], preTag: "<em>", postTag: "</em>",
    filters: [{type: "facet", field: "af", value: true, negated: false}],
  });
  expect(client.search).not.toHaveBeenCalled();
});

it("does not silently ignore lookup-only request parameters", async () => {
  const service = new ElasticService();
  await expect(service.runQuery({indexName: "users_karma", params: {}}, {emptyStringSearchResults: "default"}))
    .rejects.toThrow("require lookup search");
  await expect(service.runQuery({indexName: "users", params: {aroundLatLng: "37, -122"}}, {emptyStringSearchResults: "default"}))
    .rejects.toThrow("require lookup search");
  await expect(service.runQuery({indexName: "users,posts", params: {}}, {emptyStringSearchResults: "default", mode: "lookup"}))
    .rejects.toThrow("requires a single index");
});

it("does not query Elasticsearch for suppressed empty searches", async () => {
  const client = new ElasticClient();
  const result = await new ElasticService(client).runQuery({indexName: "sequences", params: {}}, {emptyStringSearchResults: "empty"});
  expect(result.hits).toEqual([]);
  expect(client.search).not.toHaveBeenCalled();
  expect(client.lookup).not.toHaveBeenCalled();
});
