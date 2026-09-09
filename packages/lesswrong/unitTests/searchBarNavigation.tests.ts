/** @jest-environment jsdom */
import { getNextSearchResultIndex, selectSearchResult } from "../components/search/searchBarNavigation";

it("up at the top selects the last fetched row and requests another page; down still wraps while pending", () => {
  const area = document.createElement("div");
  const links: HTMLAnchorElement[] = [];
  for (let i = 0; i < 3; i++) {
    const row = document.createElement("div");
    row.setAttribute("data-search-result", "");
    row.scrollIntoView = jest.fn();
    const link = document.createElement("a");
    link.href = `/posts/${i}`;
    Object.defineProperty(link, "getClientRects", {value: () => [{width: 10, height: 10}]});
    row.append(link);
    area.append(row);
    links.push(link);
  }
  const fetchMore = jest.fn();
  area.addEventListener("search-load-more", fetchMore);
  const lastIndex = getNextSearchResultIndex(0, links.length, "ArrowUp");
  selectSearchResult(area, links[lastIndex]);
  expect(lastIndex).toBe(2);
  expect(fetchMore).toHaveBeenCalledTimes(1);
  expect(links[2].closest('[data-search-selected]')).not.toBeNull();

  // Pending fetches do not change the length of the currently rendered list.
  const firstIndex = getNextSearchResultIndex(lastIndex, links.length, "ArrowDown");
  selectSearchResult(area, links[firstIndex]);
  expect(firstIndex).toBe(0);
  expect(links[0].closest('[data-search-selected]')).not.toBeNull();
  expect(fetchMore).toHaveBeenCalledTimes(1);
});

it("moves into newly fetched rows once they have arrived", () => {
  expect(getNextSearchResultIndex(2, 6, "ArrowDown")).toBe(3);
  expect(getNextSearchResultIndex(0, 6, "ArrowUp")).toBe(5);
});
