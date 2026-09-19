import ElasticQuery from "../../server/search/elastic/ElasticQuery";
import { compileSearchQuery } from "../../server/search/elastic/ElasticAdditiveRanking";

const cases = [
  {index: "posts", fields: ["title", "authorDisplayName"]},
  {index: "comments", fields: ["authorDisplayName"]},
  {index: "users", fields: ["displayName"]},
  {index: "tags", fields: ["name"]},
  {index: "sequences", fields: ["title", "authorDisplayName"]},
];

it("requests a comment preview when the search text is empty", () => {
  const request = new ElasticQuery({index: "comments", search: "", filters: [], mode: "lookup"}).compile();
  expect(request.body.highlight?.fields.body).toEqual(expect.objectContaining({
    highlight_query: {match_all: {}},
  }));
  expect(request.body.highlight?.no_match_size).toBe(140);
});

it("requests comment previews in empty mixed search", () => {
  const request = compileSearchQuery({indexes: ["posts", "comments"], search: ""});
  expect(request.highlight?.fields?.body).toBeDefined();
  expect(request.highlight?.no_match_size).toBe(140);
});

it.each(cases)("returns complete highlighted labels for $index", ({index, fields}) => {
  for (const search of ["alignment", '"alignment"']) {
    const request = new ElasticQuery({index, search, filters: [], mode: "lookup"}).compile();
    for (const field of fields) {
      expect(request.body.highlight?.fields[search.startsWith('"') ? `${field}.exact` : field])
        .toEqual(expect.objectContaining({number_of_fragments: 0}));
    }
  }
});

it("preserves markers and labels in mixed search", () => {
  const request = compileSearchQuery({indexes: cases.map(item => item.index), search: "alignment",
    preTag: "<ais-highlight-0000000000>", postTag: "</ais-highlight-0000000000>"});
  for (const field of ["title", "authorDisplayName", "name", "displayName"]) {
    expect(request.highlight?.fields?.[field]).toEqual(expect.objectContaining({
      number_of_fragments: 0, pre_tags: ["<ais-highlight-0000000000>"],
    }));
  }
});

it.each(["alignment", "user:eliezer alignment"])("highlights the fields actually searched for %s", search => {
  const request = new ElasticQuery({index: "posts", search, filters: []}).compile();
  expect(request.body.highlight?.fields["body.exact"]).toBeDefined();
  expect(request.body.highlight?.fields["title.exact"]).toBeDefined();
});

it("highlights every positive phrase and term, without highlighting filters or exclusions", () => {
  const request = new ElasticQuery({index: "posts", search: '"inner alignment" "outer alignment" research -unwanted user:eliezer', filters: []}).compile();
  for (const field of Object.values(request.body.highlight?.fields ?? {})) {
    const query = JSON.stringify(field.highlight_query);
    expect(query).toContain("inner alignment");
    expect(query).toContain("outer alignment");
    expect(query).toContain("research");
    expect(query).not.toContain("unwanted");
    expect(query).not.toContain("eliezer");
  }
});

it("does not highlight excluded terms in unquoted advanced searches", () => {
  const request = new ElasticQuery({index: "posts", search: "alignment -unwanted", filters: []}).compile();
  expect(JSON.stringify(request.body.highlight)).not.toContain("unwanted");
});

it("uses additive recall analyzers for stems and synonyms in snippets", () => {
  const request = compileSearchQuery({indexes: ["posts"], search: "running"});
  const recall = new ElasticQuery({index: "posts", search: "running", filters: []}).compileAdditiveRecall();
  expect(request.highlight?.fields?.body?.highlight_query).toEqual(recall.query);
  expect(request.highlight?.fields?.title?.highlight_query).toEqual(recall.query);
});
