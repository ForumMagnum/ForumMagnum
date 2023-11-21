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
