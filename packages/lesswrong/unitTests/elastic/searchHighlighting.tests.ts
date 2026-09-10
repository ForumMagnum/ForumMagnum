import ElasticQuery from "../../server/search/elastic/ElasticQuery";
import { compileMultiQuery } from "../../server/search/elastic/ElasticMultiQuery";

const cases = [
  {index: "posts", fields: ["title", "authorDisplayName"]},
  {index: "comments", fields: ["authorDisplayName"]},
  {index: "users", fields: ["displayName"]},
  {index: "tags", fields: ["name"]},
  {index: "sequences", fields: ["title", "authorDisplayName"]},
];

it.each(cases)("returns complete highlighted labels for $index", ({index, fields}) => {
  for (const search of ["alignment", '"alignment"']) {
    const request = new ElasticQuery({index, search, filters: []}).compile();
    for (const field of fields) {
      expect(request.body.highlight?.fields[search.startsWith('"') ? `${field}.exact` : field])
        .toEqual(expect.objectContaining({number_of_fragments: 0}));
    }
  }
});

it.each(["tiered", "additive"] as const)("preserves markers and labels in %s mixed search", ranking => {
  const request = compileMultiQuery({indexes: cases.map(item => item.index), search: "alignment", ranking,
    preTag: "<ais-highlight-0000000000>", postTag: "</ais-highlight-0000000000>"});
  for (const field of ["title", "authorDisplayName", "name", "displayName"]) {
    expect(request.highlight?.fields?.[`${field}.exact`]).toEqual(expect.objectContaining({
      number_of_fragments: 0, pre_tags: ["<ais-highlight-0000000000>"],
    }));
  }
});

it.each(["alignment", "user:eliezer alignment"])("highlights the fields actually searched for %s", search => {
  const request = new ElasticQuery({index: "posts", search, filters: [], unifiedRanking: true}).compile();
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
