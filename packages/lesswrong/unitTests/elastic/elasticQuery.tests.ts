import ElasticQuery, { QueryData, SEARCH_ORIGIN_DATE } from "../../server/search/elastic/ElasticQuery";

describe("ElasticQuery", () => {
  const testQuery: QueryData = {
    index: "posts",
    search: "test query",
    filters: [],
  };
  const originDate = SEARCH_ORIGIN_DATE.toISOString();
  const delta = Date.now() - SEARCH_ORIGIN_DATE.getTime();
  const dayRange = Math.ceil(delta / (1000 * 60 * 60 * 24));

  it("Can compile numeric ascending ranking", () => {
    const result = new ElasticQuery(testQuery).compileRanking({
      field: "baseScore",
      order: "asc",
      scoring: {
        type: "numeric",
        pivot: 20,
      },
    });
    expect(result).toBe("(1 - (doc['baseScore'].size() == 0 ? 0 : (saturation(Math.max(1, doc['baseScore'].value), 20L))))");
  });
  it("Can compile numeric descending ranking", () => {
    const result = new ElasticQuery(testQuery).compileRanking({
      field: "baseScore",
      order: "desc",
      scoring: {
        type: "numeric",
        pivot: 20,
      },
    });
    expect(result).toBe("(doc['baseScore'].size() == 0 ? 0 : (saturation(Math.max(1, doc['baseScore'].value), 20L)))");
  });
  it("Can compile date ascending ranking", () => {
    const result = new ElasticQuery(testQuery).compileRanking({
      field: "postedAt",
      order: "asc",
      scoring: {
        type: "date",
      },
    });
    expect(result).toBe(`(1 - (doc['postedAt'].size() == 0 ? 0 : (1 - decayDateLinear('${originDate}', '${dayRange}d', '0', 0.5, doc['postedAt'].value))))`);
  });
  it("Can compile date descending ranking", () => {
    const result = new ElasticQuery(testQuery).compileRanking({
      field: "postedAt",
      order: "desc",
      scoring: {
        type: "date",
      },
    });
    expect(result).toBe(`(doc['postedAt'].size() == 0 ? 0 : (1 - decayDateLinear('${originDate}', '${dayRange}d', '0', 0.5, doc['postedAt'].value)))`);
  });
  it("Can compile bool descending ranking", () => {
    const result = new ElasticQuery(testQuery).compileRanking({
      field: "core",
      order: "desc",
      scoring: {
        type: "bool",
      },
    });
    expect(result).toBe(`(doc['core'].size() == 0 ? 0 : (doc['core'].value == true ? 0.75 : 0.25))`);
  });
  it("Can compile bool ascending ranking", () => {
    const result = new ElasticQuery(testQuery).compileRanking({
      field: "core",
      order: "asc",
      scoring: {
        type: "bool",
      },
    });
    expect(result).toBe(`(1 - (doc['core'].size() == 0 ? 0 : (doc['core'].value == true ? 0.75 : 0.25)))`);
  });
  it("Can compile ranking with a custom weight", () => {
    const result = new ElasticQuery(testQuery).compileRanking({
      field: "baseScore",
      order: "asc",
      weight: 2,
      scoring: {
        type: "numeric",
        pivot: 20,
      },
    });
    expect(result).toBe("(1 - (doc['baseScore'].size() == 0 ? 0 : (((saturation(Math.max(1, doc['baseScore'].value), 20L)) * 2))))");
  });
});
