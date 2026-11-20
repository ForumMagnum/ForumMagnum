import { useEffect, useRef, type KeyboardEvent, type RefObject, type SyntheticEvent } from 'react';

interface SearchPageNavigationOptions {
  inputRef: RefObject<HTMLInputElement | null>,
  resultsRef: RefObject<HTMLDivElement | null>,
  searchKey: string,
  loadMore: () => Promise<void>,
  query: string,
  enterOpensResult: boolean,
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

export function useSearchPageNavigation({inputRef, resultsRef, searchKey, loadMore, query, enterOpensResult}: SearchPageNavigationOptions) {
  const previousSearchKey = useRef(searchKey);
  const selected = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const area = resultsRef.current;
    if (previousSearchKey.current !== searchKey || !selected.current || !area?.contains(selected.current)) {
      selectResult(selected, getResultRows(area)[0] ?? null);
    }
    previousSearchKey.current = searchKey;
  });

  const selectFromEvent = (event: SyntheticEvent) => {
    const row = resultFromTarget(resultsRef.current, event.target);
    if (row) selectResult(selected, row);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.nativeEvent.isComposing
      || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const input = inputRef.current;
    if (event.key === 'Enter' && event.target === input) {
      const resultsMatchInput = input?.value === query;
      const link = enterOpensResult && resultsMatchInput ? selected.current?.querySelector<HTMLAnchorElement>('a[href]') : null;
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
    const nextIndex = Math.max(0, Math.min(rows.length - 1, currentIndex + (event.key === 'ArrowDown' ? 1 : -1)));
    const next = rows[nextIndex];
    selectResult(selected, next);
    next.scrollIntoView({block: 'nearest'});
    next.querySelector<HTMLAnchorElement>('a[href]')?.focus({preventScroll: true});
    if (nextIndex === rows.length - 1) void loadMore();
  };

  /** Handlers for an element containing both the input and the results */
  return {onKeyDown, onMouseMove: selectFromEvent, onFocus: selectFromEvent};
}
