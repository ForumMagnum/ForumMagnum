import { compileMultiQuery } from "../../server/search/elastic/ElasticMultiQuery";
import ElasticClient from "../../server/search/elastic/ElasticClient";
import ElasticService from "../../server/search/elastic/ElasticService";
import Sequences from "../../server/collections/sequences/collection";

jest.mock("../../server/search/elastic/ElasticClient");
const mockSequenceFetch = jest.fn();
jest.mock("../../server/collections/sequences/collection", () => ({__esModule: true, default: {find: jest.fn(() => ({fetch: mockSequenceFetch}))}}));

beforeEach(() => {
  jest.clearAllMocks();
  mockSequenceFetch.mockReset();
  // @ts-ignore
  ElasticClient.mockClear();
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

describe("ElasticService unified requests", () => {
  it("uses additive ranking for UI requests without an explicit ranking", async () => {
    const client = new ElasticClient();
    const multiSearch = jest.spyOn(client, "multiSearch").mockResolvedValue({hits: {total: 0, hits: []}});
    await new ElasticService(client).runQuery({indexName: "posts,comments,users,tags,sequences", params: {query: "John W"}}, {emptyStringSearchResults: "default", unifiedSearch: true});
    const request = multiSearch.mock.calls[0][0];
    expect(request.ranking).toBeUndefined();
    const compiled = JSON.stringify(compileMultiQuery(request));
    expect(compiled).toContain('"function_score"');
    expect(compiled).not.toContain('"tier"');
  });

  it("loads curated sequence IDs for sequence searches and forwards them to server sorting", async () => {
    const client = new ElasticClient();
    const multiSearch = jest.spyOn(client, "multiSearch").mockResolvedValue({hits: {total: 0, hits: []}});
    mockSequenceFetch.mockResolvedValue([{_id: "curated"}]);
    await new ElasticService(client).runQuery({indexName: "sequences", params: {query: "alignment"}}, {emptyStringSearchResults: "default", unifiedSearch: true});
    expect(Sequences.find).toHaveBeenCalledWith({curatedOrder: {$exists: true}}, {}, {_id: 1});
    expect(multiSearch).toHaveBeenCalledWith(expect.objectContaining({curatedSequenceIds: ["curated"]}));
  });

  it("reports a failed curation lookup instead of silently returning the wrong order", async () => {
    const client = new ElasticClient();
    mockSequenceFetch.mockRejectedValue(new Error("Curation lookup failed"));
    await expect(new ElasticService(client).runQuery({indexName: "sequences", params: {query: "alignment"}}, {emptyStringSearchResults: "default", unifiedSearch: true}))
      .rejects.toThrow("Curation lookup failed");
    expect(client.multiSearch).not.toHaveBeenCalled();
  });

  it("does not load or promote curated sequences in the All view", async () => {
    const client = new ElasticClient();
    const multiSearch = jest.spyOn(client, "multiSearch").mockResolvedValue({hits: {total: 0, hits: []}});
    await new ElasticService(client).runQuery({indexName: "posts,comments,users,tags,sequences", params: {query: "alignment"}}, {emptyStringSearchResults: "default", unifiedSearch: true});
    expect(Sequences.find).not.toHaveBeenCalled();
    expect(multiSearch).toHaveBeenCalledWith(expect.objectContaining({curatedSequenceIds: []}));
  });

  it("parses the sort and forwards it with the new filters to the multi search", async () => {
    const service = new ElasticService();
    // @ts-ignore
    const client = ElasticClient.mock.instances[0];
    client.multiSearch.mockResolvedValue({hits: {total: 0, hits: []}});
    await service.runQuery({indexName: "posts,users", params: {
      query: "alignment", sort: ["karma:desc", "date:asc"], tagIds: ["t1"], tagMatch: "all", authorIds: ["u1"], postTypes: ["question"],
    }}, {emptyStringSearchResults: "default"});
    expect(client.multiSearch).toHaveBeenCalledWith(expect.objectContaining({
      indexes: ["posts", "users"],
      sort: [{key: "karma", direction: "desc"}, {key: "date", direction: "asc"}],
      filters: [
        {type: "tag", field: "tags", value: ["t1"], match: "all"},
        {type: "author", field: "author", value: ["u1"]},
        {type: "postType", field: "postType", value: ["question"]},
      ],
    }));
    expect(Sequences.find).not.toHaveBeenCalled();
  });

  it("rejects invalid sorts and post types", async () => {
    const service = new ElasticService();
    await expect(service.runQuery({indexName: "posts", params: {query: "x", sort: ["views:desc"]}}, {emptyStringSearchResults: "default", unifiedSearch: true}))
      .rejects.toThrow("Invalid search sort");
    expect(() => service.parseFilters(undefined, undefined, undefined, {postTypes: ["poem"]})).toThrow("Invalid post type: poem");
  });
});
