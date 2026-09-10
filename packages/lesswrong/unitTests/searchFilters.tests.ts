import {
  defaultSearchPostTypes,
  emptySearchFilters,
  searchFiltersToParams,
} from "../lib/search/searchFilters";

it("sends nothing for the empty filter state", () => {
  expect(searchFiltersToParams(emptySearchFilters)).toEqual({});
});

it("keeps event restrictions independent from post types", () => {
  expect(searchFiltersToParams({...emptySearchFilters, postTypes: defaultSearchPostTypes, events: "exclude"})).toEqual({facetFilters: [["isEvent:-true"]]});
  expect(searchFiltersToParams({...emptySearchFilters, postTypes: ["question"], events: "include"})).toEqual({postTypes: ["question"]});
  expect(searchFiltersToParams({...emptySearchFilters, events: "only"})).toEqual({facetFilters: [["isEvent:true"]]});
});

it("passes through all-tag matching", () => {
  expect(searchFiltersToParams({...emptySearchFilters, tagIds: ["a", "b"], tagMatch: "all"})).toEqual({tagIds: ["a", "b"], tagMatch: "all"});
});

it("encodes date and karma ranges as numeric filters and passes ids through", () => {
  expect(searchFiltersToParams({
    ...emptySearchFilters,
    tagIds: ["tag1"],
    authorIds: ["user1", "user2"],
    postTypes: [],
    dateRange: {start: 1000, end: 2000},
    karmaRange: {min: 10},
  })).toEqual({
    tagMatch: "any",
    tagIds: ["tag1"],
    authorIds: ["user1", "user2"],
    numericFilters: ["publicDateMs>=1000", "publicDateMs<=2000", "karma>=10"],
  });
  expect(searchFiltersToParams({...emptySearchFilters, karmaRange: {max: 5}}).numericFilters).toEqual(["karma<=5"]);
});
