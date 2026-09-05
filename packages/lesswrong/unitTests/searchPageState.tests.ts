import { resetSearchPage } from "@/lib/search/searchPageState";

describe("resetSearchPage", () => {
  it("returns to InstantSearch's zero-based first page", () => {
    expect(resetSearchPage({
      contentType: "Comments",
      query: "acausal",
      page: 7,
      toggle: {
        comments: true,
      },
    })).toEqual({
      contentType: "Comments",
      query: "acausal",
      page: 0,
      toggle: {
        comments: true,
      },
    });
  });
});
