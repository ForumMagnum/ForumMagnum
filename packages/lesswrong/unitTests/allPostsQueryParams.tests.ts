import { getAllPostsQueryParamsError } from '../components/posts/allPostsQueryParams';

describe('getAllPostsQueryParamsError', () => {
  it('accepts valid parameters', () => {
    expect(getAllPostsQueryParamsError({
      timeframe: "weekly",
      sortedBy: "top",
      filter: "linkpost",
      after: "2026-01-18",
      before: "2026-02-18",
      karmaThreshold: "-1000",
      includeEvents: "1001716604",
      limit: "100",
    })).toBeNull();
  });

  it('accepts missing and empty parameters', () => {
    expect(getAllPostsQueryParamsError({})).toBeNull();
    expect(getAllPostsQueryParamsError({ sortedBy: "", timeframe: "", filter: "", after: "", before: "" })).toBeNull();
  });

  it('rejects an invalid sortedBy', () => {
    expect(getAllPostsQueryParamsError({ sortedBy: "951851151" })).toMatch(/"sortedBy"/);
  });

  it('rejects an invalid timeframe', () => {
    expect(getAllPostsQueryParamsError({ timeframe: "fortnightly" })).toMatch(/"timeframe"/);
  });

  it('rejects an invalid filter', () => {
    expect(getAllPostsQueryParamsError({ filter: "toString" })).toMatch(/"filter"/);
  });

  it('rejects repeated parameters', () => {
    expect(getAllPostsQueryParamsError({ sortedBy: ["top", "new"] })).toMatch(/"sortedBy"/);
  });

  it('rejects malformed dates', () => {
    expect(getAllPostsQueryParamsError({ after: "2026-13-01" })).toMatch(/"after"/);
    expect(getAllPostsQueryParamsError({ before: "yesterday" })).toMatch(/"before"/);
  });

  it('rejects a date range that ends before it starts', () => {
    expect(getAllPostsQueryParamsError({ after: "2026-02-01", before: "2026-01-01" })).toMatch(/later than/);
    expect(getAllPostsQueryParamsError({ after: "2026-01-01", before: "2026-01-01" })).toBeNull();
  });
});
