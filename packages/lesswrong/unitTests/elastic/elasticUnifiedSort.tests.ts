import {
  compileUnifiedSort,
  karmaSortScript,
  commentsSortScript,
} from "../../server/search/elastic/ElasticUnifiedSort";

const tiebreakers = [{objectID: "asc"}, {_index: "asc"}];

it("keeps the ranked default when no sort is given", () => {
  expect(compileUnifiedSort(undefined)).toEqual([{_score: {order: "desc"}}, ...tiebreakers]);
});

it("sorts by exact values in the requested order and preserves relevance direction", () => {
  expect(compileUnifiedSort([
    {key: "karma", direction: "desc"},
    {key: "date", direction: "asc"},
    {key: "relevance", direction: "asc"},
    {key: "comments", direction: "desc"},
  ])).toEqual([
    {_script: {type: "number", order: "desc", script: {source: karmaSortScript}}},
    {publicDateMs: {order: "asc", missing: "_last", unmapped_type: "long"}},
    {_score: {order: "asc"}},
    {_script: {type: "number", order: "desc", script: {source: commentsSortScript}}},
    ...tiebreakers,
  ]);
});

it("keeps date primary and missing dates last in either direction", () => {
  expect(compileUnifiedSort([{key: "date", direction: "desc"}])).toEqual([
    {publicDateMs: {order: "desc", missing: "_last", unmapped_type: "long"}},
    ...tiebreakers,
  ]);
});
