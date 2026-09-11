import ElasticQuery, { QueryData, getSearchOriginDate } from "../../server/search/elastic/ElasticQuery";

describe("ElasticQuery", () => {
  const testQuery: QueryData = {
    index: "posts",
    search: "test query",
    filters: [],
  };
  const originDate = getSearchOriginDate().toISOString();
  const delta = Date.now() - getSearchOriginDate().getTime();
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

  it("Keeps user filters when using quoted terms", () => {
    const compiledQuery = new ElasticQuery({
      index: "posts",
      search: 'user:eliezer_yudkowsky "qualia"',
      filters: [],
    }).compile();

    const requestBody = compiledQuery.body;
    const filterClauses = requestBody.query?.script_score?.query?.bool?.filter ?? [];
    const hasUserFilter = filterClauses.some((clause) => {
      const userShoulds = clause.bool?.should ?? [];
      const userShouldsArray = Array.isArray(userShoulds) ? userShoulds : [userShoulds];
      return userShouldsArray.some((shouldClause) => {
        const term = shouldClause.term ?? {};
        return term["authorSlug.sort"] === "eliezer_yudkowsky";
      });
    });

    expect(hasUserFilter).toBe(true);
  });
});

describe("ElasticQuery unified filters", () => {
  const filterClauses = (index: string, filters: QueryData["filters"], search = "alignment") => {
    const body = new ElasticQuery({index, search, filters}).compile().body;
    return JSON.stringify(body.query?.script_score?.query?.bool?.filter ?? []);
  };

  it("filters tags by the shape each index stores", () => {
    const tag = [{type: "tag" as const, field: "tags", value: ["t1", "t2"]}];
    expect(filterClauses("posts", tag)).toContain('{"terms":{"tags._id":["t1","t2"]}}');
    expect(filterClauses("users", tag)).toContain('{"terms":{"tags._id":["t1","t2"]}}');
    expect(filterClauses("comments", tag)).toContain('{"terms":{"tags":["t1","t2"]}}');
    expect(filterClauses("tags", tag)).toContain('{"terms":{"objectID":["t1","t2"]}}');
    expect(filterClauses("sequences", tag)).toContain('{"match_none":{}}');
  });

  it.each(["any", "all"] as const)("treats a wikitag as tagged with itself in match-%s searches", (match) => {
    const filters: QueryData["filters"] = [{type: "tag", field: "tags", value: ["t1"], match}];
    const expected = match === "all"
      ? {bool: {should: [], filter: [{term: {objectID: "t1"}}]}}
      : {terms: {objectID: ["t1"]}};
    for (const search of ["", "alignment"]) {
      const query = new ElasticQuery({index: "tags", search, filters});
      expect(query.compile().body.query.script_score.query.bool.filter).toContainEqual(expected);
      expect(query.compileAdditiveRecall().filters).toContainEqual(expected);
    }
  });

  it("requires every tag in match-all mode", () => {
    const tags: QueryData["filters"] = [{type: "tag", field: "tags", value: ["t1", "t2"], match: "all"}];
    expect(filterClauses("posts", tags)).toContain('"filter":[{"term":{"tags._id":"t1"}},{"term":{"tags._id":"t2"}}]');
    expect(filterClauses("comments", tags)).toContain('"filter":[{"term":{"tags":"t1"}},{"term":{"tags":"t2"}}]');
    expect(filterClauses("tags", tags)).toContain('"filter":[{"term":{"objectID":"t1"}},{"term":{"objectID":"t2"}}]');
  });

  it("requires both numeric bounds, instead of accepting either", () => {
    const range: QueryData["filters"] = [
      {type: "numeric", field: "karma", op: "gte", value: 10},
      {type: "numeric", field: "karma", op: "lte", value: 20},
    ];
    expect(filterClauses("posts", range)).toContain('{"range":{"baseScore":{"gte":10}}},{"range":{"baseScore":{"lte":20}}}');
  });

  it("filters authors by authorship on content and by identity on users", () => {
    const author = [{type: "author" as const, field: "author", value: ["u1"]}];
    const posts = filterClauses("posts", author);
    expect(posts).toContain('{"terms":{"userId":["u1"]}}');
    expect(posts).toContain('{"terms":{"coauthorIds":["u1"]}}');
    expect(filterClauses("comments", author)).toContain('{"terms":{"userId":["u1"]}}');
    const sequences = filterClauses("sequences", author);
    expect(sequences).toContain('{"terms":{"userId":["u1"]}}');
    expect(sequences).toContain('{"terms":{"collectedAuthorIds":["u1"]}}');
    expect(filterClauses("users", author)).toContain('{"terms":{"objectID":["u1"]}}');
    expect(filterClauses("tags", author)).toContain('{"match_none":{}}');
  });

  it("preserves other kinds when selecting post types and treats articles as none of the other types", () => {
    const types = [{type: "postType" as const, field: "postType", value: ["question" as const, "event" as const, "linkpost" as const]}];
    const posts = filterClauses("posts", types);
    expect(posts).toContain('{"term":{"question":true}}');
    expect(posts).toContain('{"term":{"isEvent":true}}');
    expect(posts).toContain('{"exists":{"field":"url"}}');
    expect(posts).toContain('"minimum_should_match":1');
    const articles = filterClauses("posts", [{type: "postType", field: "postType", value: ["article"]}]);
    expect(articles).toContain('"must_not":[{"term":{"question":true}},{"term":{"isEvent":true}},{"term":{"shortform":true}},{"exists":{"field":"url"}}]');
    for (const index of ["comments", "users", "tags", "sequences"]) {
      expect(filterClauses(index, types)).toContain('{"match_all":{}}');
    }
  });

  it("highlights text without passing article exclusions to the plain highlighter", () => {
    const body = new ElasticQuery({index: "posts", search: "alignment", filters: [
      {type: "postType", field: "postType", value: ["article"]},
    ]}).compile().body;
    const fields = Object.values(body.highlight?.fields ?? {});
    expect(fields.length).toBeGreaterThan(0);
    for (const field of fields) {
      expect(field.highlight_query).toEqual(body.query.script_score.query.bool.must);
      expect(JSON.stringify(field.highlight_query)).not.toContain('"exists"');
    }
    expect(JSON.stringify(body.query.script_score.query.bool.filter)).toContain('"exists":{"field":"url"}');
  });

  it("maps karma range filters to the karma field of each index", () => {
    const karma = [{type: "numeric" as const, field: "karma", value: 10, op: "gte" as const}];
    expect(filterClauses("users", karma)).toContain('{"range":{"karma":{"gte":10}}}');
    expect(filterClauses("posts", karma)).toContain('{"range":{"baseScore":{"gte":10}}}');
    expect(filterClauses("tags", karma)).toContain('{"range":{"baseScore":{"gte":10}}}');
  });

  it("matches tag query tokens against comment tag id arrays too", () => {
    expect(filterClauses("comments", [], 'tag:t1 "qualia"')).toContain('{"term":{"tags":"t1"}}');
  });
});
