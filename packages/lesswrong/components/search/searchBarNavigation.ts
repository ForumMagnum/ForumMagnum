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
  if (resultCount === 0) return -1;
  if (currentIndex === -1) return 0;
  return Math.max(0, Math.min(resultCount - 1, currentIndex + (direction === 'ArrowDown' ? 1 : -1)));
}
