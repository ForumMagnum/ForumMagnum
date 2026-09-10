import ElasticClient from "../../server/search/elastic/ElasticClient";
import ElasticService from "../../server/search/elastic/ElasticService";

jest.mock("../../server/search/elastic/ElasticClient");

beforeEach(() => {
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
  });

  it("rejects invalid sorts and post types", async () => {
    const service = new ElasticService();
    await expect(service.runQuery({indexName: "posts", params: {query: "x", sort: ["views:desc"]}}, {emptyStringSearchResults: "default", unifiedSearch: true}))
      .rejects.toThrow("Invalid search sort");
    expect(() => service.parseFilters(undefined, undefined, undefined, {postTypes: ["poem"]})).toThrow("Invalid post type: poem");
  });
});
