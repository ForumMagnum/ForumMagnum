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

function selectResult(selectedRef: RefObject<HTMLElement | null>, next: HTMLElement | null) {
  if (selectedRef.current === next) return;
  selectedRef.current?.removeAttribute('data-search-selected');
  next?.setAttribute('data-search-selected', 'true');
  selectedRef.current = next;
}

function resultFromTarget(area: HTMLDivElement | null, target: EventTarget | null): HTMLElement | null {
  const row = target instanceof Element ? target.closest<HTMLElement>('[data-search-result]') : null;
  return row && area?.contains(row) && row.querySelector('a[href]') ? row : null;
}

export function useSearchPageNavigation({inputRef, resultsRef, searchKey, loadMore}: SearchPageNavigationOptions) {
  const previousSearchKey = useRef(searchKey);
  const selected = useRef<HTMLElement | null>(null);
  const attachedArea = useRef<HTMLDivElement | null>(null);
  const detachListeners = useRef<(() => void) | null>(null);

  useEffect(() => {
    const area = resultsRef.current;
    if (previousSearchKey.current !== searchKey || !selected.current || !area?.contains(selected.current)) {
      selectResult(selected, getResultRows(area)[0] ?? null);
    }
    previousSearchKey.current = searchKey;
  });

  useEffect(() => {
    const area = resultsRef.current;
    if (area === attachedArea.current) return;
    detachListeners.current?.();
    attachedArea.current = area;
    const selectFromEvent = (event: Event) => {
      const row = resultFromTarget(area, event.target);
      if (row) selectResult(selected, row);
    };
    area?.addEventListener('mousemove', selectFromEvent);
    area?.addEventListener('focusin', selectFromEvent);
    detachListeners.current = () => {
      area?.removeEventListener('mousemove', selectFromEvent);
      area?.removeEventListener('focusin', selectFromEvent);
    };
  });

  useEffect(() => () => {
    detachListeners.current?.();
    attachedArea.current = null;
    detachListeners.current = null;
  }, []);

  return (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.nativeEvent.isComposing
      || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const input = inputRef.current;
    if (event.key === 'Enter' && event.target === input) {
      const link = selected.current?.querySelector<HTMLAnchorElement>('a[href]');
      if (link) {
        event.preventDefault();
        event.stopPropagation();
        link.click();
      }
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const focusedRow = resultFromTarget(resultsRef.current, event.target);
    if (event.target !== input && !focusedRow) return;
    event.preventDefault();
    event.stopPropagation();
    const rows = getResultRows(resultsRef.current);
    if (!rows.length) return;
    const currentIndex = rows.findIndex(row => row === (focusedRow ?? selected.current));
    const nextIndex = getNextSearchResultIndex(currentIndex, rows.length, event.key);
    const next = rows[nextIndex];
    selectResult(selected, next);
    next.scrollIntoView({block: 'nearest'});
    next.querySelector<HTMLAnchorElement>('a[href]')?.focus({preventScroll: true});
    if (nextIndex === rows.length - 1) void loadMore();
  };
}
