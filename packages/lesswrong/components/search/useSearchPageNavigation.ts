import { useEffect, useRef, type KeyboardEvent, type RefObject } from 'react';
import { getNextSearchResultIndex } from './searchBarNavigation';

interface SearchPageNavigationOptions {
  inputRef: RefObject<HTMLInputElement | null>,
  resultsRef: RefObject<HTMLDivElement | null>,
  searchKey: string,
  loadMore: () => Promise<void>,
}

function getResultRows(area: HTMLDivElement | null) {
  return Array.from(area?.querySelectorAll<HTMLElement>('[data-search-result]') ?? [])
    .filter(row => row.querySelector('a[href]'));
}

function highlightResult(rows: HTMLElement[], selected: HTMLElement | undefined) {
  for (const row of rows) {
    if (row === selected) row.setAttribute('data-search-selected', 'true');
    else row.removeAttribute('data-search-selected');
  }
}

function selectResultFromEvent(event: Event) {
  const area = event.currentTarget;
  const target = event.target;
  if (!(area instanceof HTMLDivElement) || !(target instanceof Node)) return;
  const rows = getResultRows(area);
  const selected = rows.find(row => row.contains(target));
  if (selected) highlightResult(rows, selected);
}

export function useSearchPageNavigation({inputRef, resultsRef, searchKey, loadMore}: SearchPageNavigationOptions) {
  const previousSearchKey = useRef(searchKey);

  // Check after every render so asynchronously loaded results get a selection.
  // Appending a page keeps the selection; changing the search resets it.
  useEffect(() => {
    const rows = getResultRows(resultsRef.current);
    if (previousSearchKey.current !== searchKey || !rows.some(row => row.hasAttribute('data-search-selected'))) {
      highlightResult(rows, rows[0]);
    }
    previousSearchKey.current = searchKey;
    const area = resultsRef.current;
    // Movement lets the mouse reclaim selection even within the same row.
    // A stationary pointer must not override arrow navigation or its scrolling.
    area?.addEventListener('mousemove', selectResultFromEvent);
    area?.addEventListener('focusin', selectResultFromEvent);
    return () => {
      area?.removeEventListener('mousemove', selectResultFromEvent);
      area?.removeEventListener('focusin', selectResultFromEvent);
    };
  });

  return (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.nativeEvent.isComposing
      || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const input = inputRef.current;
    const rows = getResultRows(resultsRef.current);
    if (event.key === 'Enter' && event.target === input) {
      const selected = rows.find(row => row.hasAttribute('data-search-selected'));
      const link = selected?.querySelector<HTMLAnchorElement>('a[href]');
      if (link) {
        event.preventDefault();
        event.stopPropagation();
        link.click();
      }
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const target = event.target;
    const focusedIndex = target instanceof Node ? rows.findIndex(row => row.contains(target)) : -1;
    if (target !== input && focusedIndex === -1) return;
    event.preventDefault();
    event.stopPropagation();
    if (!rows.length) return;
    const currentIndex = target === input
      ? rows.findIndex(row => row.hasAttribute('data-search-selected'))
      : focusedIndex;
    const nextIndex = getNextSearchResultIndex(currentIndex, rows.length, event.key);
    highlightResult(rows, rows[nextIndex]);
    rows[nextIndex].scrollIntoView({block: 'nearest'});
    input?.focus({preventScroll: true});
    if (nextIndex === rows.length - 1) void loadMore();
  };
}
