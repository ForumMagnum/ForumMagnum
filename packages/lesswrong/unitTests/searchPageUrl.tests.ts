import { emptySearchFilters, defaultSearchPostTypes, searchFiltersToParams } from "../lib/search/searchFilters";
import { searchPageStateFromQuery, searchPageStateToQuery, defaultSearchPageState, searchPageLink } from "../components/search/searchPageUrl";
import { defaultSearchSort } from "../lib/search/searchSorting";

it("reads a bare query and writes back only non-default state", () => {
  const state = searchPageStateFromQuery({query: "decision theory"});
  expect(state).toEqual({...defaultSearchPageState, query: "decision theory"});
  expect(searchPageStateToQuery(state)).toEqual({query: "decision theory"});
  expect(searchPageStateToQuery(defaultSearchPageState)).toEqual({});
});

it("round-trips kinds, sort, tags, authors, post types, dates and karma", () => {
  const query = {
    query: "x",
    kinds: "Posts,Comments",
    sort: "date:asc,relevance:desc,karma:desc,comments:desc",
    tags: "t1,t2",
    authors: "u1",
    types: "question",
    events: "include",
    tagMatch: "all",
    from: "2020-01-15",
    to: "2021-03-01",
    karma: "10-50",
  };
  const state = searchPageStateFromQuery(query);
  expect(state.kinds).toEqual(["Posts", "Comments"]);
  expect(state.sort[0]).toEqual({key: "date", direction: "asc"});
  expect(state.filters).toEqual({
    tagIds: ["t1", "t2"],
    authorIds: ["u1"],
    postTypes: ["question"],
    events: "include",
    tagMatch: "all",
    dateRange: {start: Date.UTC(2020, 0, 15), end: Date.UTC(2021, 2, 2) - 1},
    karmaRange: {min: 10, max: 50},
  });
  expect(searchPageStateToQuery(state)).toEqual(query);
});

it("drops unknown kinds, post types and malformed ranges instead of guessing", () => {
  const state = searchPageStateFromQuery({kinds: "Posts,Banana", types: "question,poem", from: "yesterday", karma: "lots"});
  expect(state.kinds).toEqual(["Posts"]);
  expect(state.filters.postTypes).toEqual(["question"]);
  expect(state.filters.dateRange).toEqual({});
  expect(state.filters.karmaRange).toEqual({});
  expect(state.sort).toEqual(defaultSearchSort);
});

it("treats absent post types as the default and writes every other selection", () => {
  expect(searchPageStateFromQuery({}).filters.postTypes).toEqual(["article", "question", "linkpost", "shortform"]);
  expect(searchPageStateFromQuery({types: "poem"}).filters.postTypes).toEqual(["article", "question", "linkpost", "shortform"]);
  const everything = ["article", "question", "linkpost", "shortform", "event"] as const;
  const state = {...defaultSearchPageState, filters: {...defaultSearchPageState.filters, postTypes: [...everything]}};
  expect(searchPageStateToQuery(state)).toEqual({types: everything.join(",")});
});

it("writes open-ended karma ranges and accepts the legacy contentType parameter", () => {
  expect(searchPageStateToQuery({...defaultSearchPageState, filters: {...defaultSearchPageState.filters, karmaRange: {min: 5}}})).toEqual({karma: "5-"});
  expect(searchPageStateFromQuery({karma: "-20"}).filters.karmaRange).toEqual({max: 20});
  expect(searchPageStateFromQuery({contentType: "Tags"}).kinds).toEqual(["Tags"]);
});

 it("upgrades legacy event selections and honors explicit event state", () => {
  expect(searchPageStateFromQuery({types: "event"}).filters.events).toBe("only");
  const state = searchPageStateFromQuery({types: "question,event"});
  expect(state.filters.postTypes).toEqual(["question"]);
  expect(searchPageStateToQuery(state)).toEqual({types: "question", events: "include"});
  expect(searchPageStateFromQuery({types: "event", events: "exclude"}).filters.events).toBe("exclude");
});

it("rejects reversed and non-finite karma bounds", () => {
  expect(searchPageStateFromQuery({karma: "100-2"}).filters.karmaRange).toEqual({});
  expect(searchPageStateFromQuery({karma: "9".repeat(400) + "-"}).filters.karmaRange).toEqual({});
  expect(searchPageStateFromQuery({karma: "-30--5"}).filters.karmaRange).toEqual({min: -30, max: -5});
});

it("rejects impossible calendar dates and reversed timeframes", () => {
  expect(searchPageStateFromQuery({from: "2023-02-29", to: "2020-13-01"}).filters.dateRange).toEqual({});
  expect(searchPageStateFromQuery({from: "2021-01-01", to: "2020-01-01"}).filters.dateRange).toEqual({});
  expect(searchPageStateFromQuery({from: "2024-02-29"}).filters.dateRange.start).toBe(Date.UTC(2024, 1, 29));
});

it("preserves exact preset timestamps across URL round trips", () => {
  const state = {...defaultSearchPageState, filters: {...defaultSearchPageState.filters, dateRange: {start: Date.UTC(2026, 8, 9, 12, 34, 56, 789)}}};
  expect(searchPageStateFromQuery(searchPageStateToQuery(state))).toEqual(state);
  expect(searchPageStateFromQuery({from: "2023-02-30T12:00:00.000Z"}).filters.dateRange).toEqual({});
});

it("keeps cleared filters unrestricted after sharing and reopening the URL", () => {
  const cleared = {...defaultSearchPageState, query: "decision theory", filters: {...emptySearchFilters, postTypes: defaultSearchPostTypes}};
  const query = searchPageStateToQuery(cleared);
  expect(query).toEqual({query: "decision theory", events: "include"});
  expect(searchFiltersToParams(searchPageStateFromQuery(query).filters)).toEqual({});
});

it("preserves sidebar content kinds and safely encodes the query in advanced links", () => {
  const url = new URL(searchPageLink("a & b?", ["Posts", "Comments"]), "https://example.com");
  expect(url.pathname).toBe("/search");
  expect(searchPageStateFromQuery(Object.fromEntries(url.searchParams))).toMatchObject({query: "a & b?", kinds: ["Posts", "Comments"]});
  expect(new URL(searchPageLink("x", []), "https://example.com").searchParams.has("kinds")).toBe(false);
});
