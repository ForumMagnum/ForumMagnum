import {
  defaultSearchSort,
  formatSearchSort,
  parseSearchSort,
  searchSortFromUrlParam,
  searchSortToUrlParam,
} from "../lib/search/searchSorting";

it("formats and parses the request form of a sort", () => {
  const formatted = formatSearchSort([{key: "karma", direction: "desc"}, {key: "date", direction: "asc"}]);
  expect(formatted).toEqual(["karma:desc", "date:asc"]);
  expect(parseSearchSort(formatted)).toEqual([{key: "karma", direction: "desc"}, {key: "date", direction: "asc"}]);
});

it("rejects unknown keys, unknown directions, duplicates and empty sorts", () => {
  expect(() => parseSearchSort(["views:desc"])).toThrow("Invalid search sort");
  expect(() => parseSearchSort(["karma:sideways"])).toThrow("Invalid search sort");
  expect(() => parseSearchSort(["karma:desc", "karma:asc"])).toThrow("Invalid search sort");
  expect(() => parseSearchSort(["karma:desc:extra"])).toThrow("Invalid search sort");
  expect(() => parseSearchSort([])).toThrow("Invalid search sort");
});

it("omits the default sort from the URL and completes partial URL sorts in default order", () => {
  expect(searchSortToUrlParam(defaultSearchSort)).toBeUndefined();
  expect(searchSortToUrlParam([{key: "date", direction: "asc"}])).toBe("date:asc");
  expect(searchSortFromUrlParam(undefined)).toEqual(defaultSearchSort);
  expect(searchSortFromUrlParam("date:asc")).toEqual([
    {key: "date", direction: "asc"},
    {key: "relevance", direction: "desc"},
    {key: "karma", direction: "desc"},
    {key: "comments", direction: "desc"},
  ]);
  expect(searchSortFromUrlParam("nonsense")).toEqual(defaultSearchSort);
});
