export function getVisibleSearchResults(area: HTMLDivElement | null) {
  return Array.from(area?.querySelectorAll<HTMLAnchorElement>(
    '[data-search-result] a[href]'
  ) ?? []).filter(result => result.getClientRects().length > 0);
}

export function getSearchResultsSignature(results: HTMLAnchorElement[]) {
  return JSON.stringify(results.map(result => [result.href, result.textContent]));
}

export function selectSearchResult(area: HTMLDivElement | null, result: HTMLAnchorElement | undefined) {
  area?.querySelectorAll('[data-search-selected]').forEach(previous => {
    previous.removeAttribute('data-search-selected');
  });
  const row = result?.closest('[data-search-result]');
  row?.setAttribute('data-search-selected', 'true');
  row?.scrollIntoView({block: 'nearest'});
  if (result && result === getVisibleSearchResults(area).at(-1)) {
    row?.dispatchEvent(new Event('search-load-more', {bubbles: true}));
  }
}

export function getNextSearchResultIndex(currentIndex: number, resultCount: number, direction: "ArrowUp" | "ArrowDown") {
  if (currentIndex === -1) return direction === 'ArrowDown' ? 0 : resultCount - 1;
  return (currentIndex + (direction === 'ArrowDown' ? 1 : -1) + resultCount) % resultCount;
}
