import { defaultSearchPageState, mergeSearchPageParams, searchPageStateFromSearch } from "../components/search/searchPageUrl";
import { defaultSearchFilters } from "../lib/search/searchFilters";

describe("searchPageUrl", () => {
  it("leaves the defaults out of the URL", () => {
    expect(mergeSearchPageParams("", defaultSearchPageState)).toBe("");
  });

  it("reads an empty URL as the default state", () => {
    expect(searchPageStateFromSearch("", "page")).toEqual(defaultSearchPageState);
  });

  it("round-trips the event filter and post types", () => {
    const state = {
      ...defaultSearchPageState,
      query: "meetup",
      filters: {...defaultSearchFilters, events: "only" as const, postTypes: ["question" as const]},
    };
    const search = mergeSearchPageParams("", state, "modal");
    expect(search).toBe("search.query=meetup&search.events=only&search.types=question");
    expect(searchPageStateFromSearch(`?${search}`, "modal")).toEqual(state);
  });

  it("falls back to the defaults for unknown event filters and post types", () => {
    const {filters} = searchPageStateFromSearch("?events=sometimes&types=event", "page");
    expect(filters.events).toBe(defaultSearchFilters.events);
    expect(filters.postTypes).toEqual(defaultSearchFilters.postTypes);
  });
});
