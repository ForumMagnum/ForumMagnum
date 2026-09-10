/** @jest-environment jsdom */
import { getNextSearchResultIndex, selectSearchResult } from "../components/search/searchBarNavigation";

it("arrow navigation stops at the ends and still requests more results at the bottom", () => {
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
  const firstIndex = getNextSearchResultIndex(0, links.length, "ArrowUp");
  selectSearchResult(area, links[firstIndex]);
  expect(firstIndex).toBe(0);
  expect(fetchMore).not.toHaveBeenCalled();
  expect(links[0].closest('[data-search-selected]')).not.toBeNull();

  // Pending fetches do not change the length of the currently rendered list.
  const lastIndex = getNextSearchResultIndex(2, links.length, "ArrowDown");
  selectSearchResult(area, links[lastIndex]);
  expect(lastIndex).toBe(2);
  expect(links[2].closest('[data-search-selected]')).not.toBeNull();
  expect(fetchMore).toHaveBeenCalledTimes(1);
});

it("moves into newly fetched rows once they have arrived", () => {
  expect(getNextSearchResultIndex(2, 6, "ArrowDown")).toBe(3);
  expect(getNextSearchResultIndex(3, 6, "ArrowUp")).toBe(2);
});

it("selects the first row from an unselected list and handles empty or single-result lists", () => {
  const directions: Array<"ArrowUp" | "ArrowDown"> = ["ArrowUp", "ArrowDown"];
  for (const direction of directions) {
    expect(getNextSearchResultIndex(-1, 3, direction)).toBe(0);
    expect(getNextSearchResultIndex(0, 1, direction)).toBe(0);
    expect(getNextSearchResultIndex(-1, 0, direction)).toBe(-1);
  }
});
