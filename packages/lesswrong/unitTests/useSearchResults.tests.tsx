/** @jest-environment jsdom */
import { act, renderHook, waitFor } from "@testing-library/react";
import { useSearchResults } from "../components/search/useSearchResults";

const mockSearch = jest.fn();
jest.mock("../lib/search/searchUtil", () => ({getSearchClient: () => ({search: mockSearch})}));
jest.mock("../lib/instanceSettings", () => ({isAF: () => false}));

function page(id: string, nbPages = 3) {
  return {results: [{hits: [{_id: id, objectID: id, _index: "posts"}], nbPages}]};
}

beforeEach(() => mockSearch.mockReset());

it("appends pages and prevents duplicate requests while a page is pending", async () => {
  let resolveNext: (value: unknown) => void = () => {};
  mockSearch.mockResolvedValueOnce(page("first"))
    .mockReturnValueOnce(new Promise(resolve => { resolveNext = resolve; }));
  const {result} = renderHook(() => useSearchResults({indexName: "posts,users", query: "test"}, true));
  await waitFor(() => expect(result.current.hits).toHaveLength(1));
  act(() => { void result.current.loadMore(); void result.current.loadMore(); });
  expect(mockSearch).toHaveBeenCalledTimes(2);
  expect(mockSearch.mock.calls[1][0][0].params).toMatchObject({
    page: 1,
    highlightPreTag: "<ais-highlight-0000000000>",
    highlightPostTag: "</ais-highlight-0000000000>",
  });
  await act(async () => { resolveNext(page("second", 2)); });
  expect(result.current.hits.map(hit => hit._id)).toEqual(["first", "second"]);
  expect(result.current.hasMore).toBe(false);
});

it("ignores stale results when query or content kinds change", async () => {
  let resolveOld: (value: unknown) => void = () => {};
  mockSearch.mockReturnValueOnce(new Promise(resolve => { resolveOld = resolve; }))
    .mockResolvedValueOnce(page("new"));
  const {result, rerender} = renderHook(({index, query}) => useSearchResults({indexName: index, query}, true), {
    initialProps: {index: "posts,users", query: "old"},
  });
  rerender({index: "users", query: "new"});
  await waitFor(() => expect(result.current.hits[0]?._id).toBe("new"));
  await act(async () => { resolveOld(page("old")); });
  expect(result.current.hits.map(hit => hit._id)).toEqual(["new"]);
});

it("retries a failed page without skipping it and does not fetch while closed", async () => {
  mockSearch.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(page("retry", 1));
  const {result, rerender} = renderHook(({open}) => useSearchResults({indexName: "posts", query: "test"}, open), {
    initialProps: {open: false},
  });
  expect(mockSearch).not.toHaveBeenCalled();
  rerender({open: true});
  await waitFor(() => expect(result.current.error).toBe(true));
  await act(async () => { await result.current.loadMore(); });
  expect(result.current.hits[0]._id).toBe("retry");
  expect(mockSearch.mock.calls[1][0][0].params.page).toBe(0);
});

it("sends sort and filter parameters and restarts when they change", async () => {
  mockSearch.mockResolvedValueOnce(page("first")).mockResolvedValueOnce(page("second"));
  const {result, rerender} = renderHook((request: Parameters<typeof useSearchResults>[0]) => useSearchResults(request, true), {
    initialProps: {indexName: "posts", query: "test", sort: ["karma:desc"], filters: {tagIds: ["t1"], numericFilters: ["karma>=5"]}},
  });
  await waitFor(() => expect(result.current.hits[0]?._id).toBe("first"));
  expect(mockSearch.mock.calls[0][0][0].params).toMatchObject({sort: ["karma:desc"], tagIds: ["t1"], numericFilters: ["karma>=5"]});
  rerender({indexName: "posts", query: "test", sort: ["date:asc"], filters: {}});
  await waitFor(() => expect(result.current.hits.map(hit => hit._id)).toEqual(["second"]));
  expect(mockSearch.mock.calls[1][0][0].params.sort).toEqual(["date:asc"]);
  expect(mockSearch.mock.calls[1][0][0].params.tagIds).toBeUndefined();
});
