import { useEffect, useRef, useState } from 'react';

interface ListPagesState {
  pageStarts: number[],
  pageIndex: number,
  /** Navigating to or preloading a page asks for the list to be loaded this far */
  requestedItemCount: number,
}

interface LoadState {
  inFlight: boolean,
  finishedFromItemCount: number | null,
}

interface ListExtent {
  pageSize: number,
  itemCount: number,
  awaitedItemCount: number,
}

export interface ListPage {
  start: number,
  end: number,
  /** Slots that items are still being loaded into */
  placeholderCount: number,
}

const getPage = (pageStarts: number[], pageIndex: number, { pageSize, itemCount, awaitedItemCount }: ListExtent): ListPage => {
  if (pageIndex >= pageStarts.length) {
    return { start: itemCount, end: itemCount, placeholderCount: 0 };
  }
  const start = pageStarts[pageIndex];
  const plannedEnd = pageStarts[pageIndex + 1] ?? (start + pageSize);
  const end = Math.max(start, Math.min(plannedEnd, itemCount));
  const awaitedEnd = Math.min(plannedEnd, awaitedItemCount);
  return { start, end, placeholderCount: Math.max(0, awaitedEnd - end) };
};

const withPageRequested = (state: ListPagesState, pageIndex: number, pageSize: number, itemCount: number): ListPagesState => {
  const awaitedItemCount = Math.max(itemCount, state.requestedItemCount);
  const previousPage = getPage(state.pageStarts, pageIndex - 1, { pageSize, itemCount, awaitedItemCount });
  const pageStarts = pageIndex < state.pageStarts.length
    ? state.pageStarts
    : [...state.pageStarts, previousPage.end + previousPage.placeholderCount];
  return {
    ...state,
    pageStarts,
    requestedItemCount: Math.max(state.requestedItemCount, pageStarts[pageIndex] + pageSize),
  };
};

const withoutPagesPast = (state: ListPagesState, itemCount: number): ListPagesState => {
  const pageStarts = state.pageStarts.filter((start, index) => index === 0 || start < itemCount);
  return {
    pageStarts,
    pageIndex: Math.min(state.pageIndex, pageStarts.length - 1),
    requestedItemCount: itemCount,
  };
};

/**
 * Pages over a list that grows by loading more. A page can be shown, or
 * preloaded, before its items exist: it holds placeholders until loads have
 * brought the list up to the item count that has been asked for.
 *
 * A page starts where the page before it ended, rather than at a multiple of
 * the page size, so a first page that came back short stays as it is and the
 * second page continues from there.
 */
export const useListPages = ({ itemCount, pageSize, loadMore, loading }: {
  itemCount: number,
  pageSize: number,
  loadMore: () => Promise<unknown>,
  loading: boolean,
}) => {
  const [state, setState] = useState<ListPagesState>({ pageStarts: [0], pageIndex: 0, requestedItemCount: 0 });
  const [load, setLoad] = useState<LoadState>({ inFlight: false, finishedFromItemCount: null });
  const loadInFlightRef = useRef(false);
  const nextPageWantedRef = useRef(false);

  // `loading` arrives in the same update as the loaded items, whereas our own
  // flag clears when the load's promise settles, which can be before or after
  // that. Waiting for both means a finished load is never seen without its items.
  const loadingMore = load.inFlight || loading;
  const reachedEnd = !loadingMore && load.finishedFromItemCount === itemCount;

  // Pages past the end have to be dropped from the state, not just hidden:
  // otherwise they'd come back to life if the item count later changed.
  if (reachedEnd && state.requestedItemCount > itemCount) {
    setState(withoutPagesPast(state, itemCount));
  }

  const awaitedItemCount = reachedEnd ? itemCount : Math.max(itemCount, state.requestedItemCount);
  const needsLoad = !loadingMore && itemCount < awaitedItemCount;
  const canGoToNextPage = !reachedEnd || state.pageIndex + 1 < state.pageStarts.length;

  useEffect(() => {
    if (!needsLoad || loadInFlightRef.current) return;

    loadInFlightRef.current = true;
    setLoad({ inFlight: true, finishedFromItemCount: null });
    void loadMore().then(() => {
      loadInFlightRef.current = false;
      setLoad({ inFlight: false, finishedFromItemCount: itemCount });
    }, (error: unknown) => {
      loadInFlightRef.current = false;
      setLoad({ inFlight: false, finishedFromItemCount: null });
      setState(current => withoutPagesPast(current, itemCount));
      throw error;
    });
  }, [needsLoad, loadMore, itemCount]);

  const goToNextPage = () => {
    if (!canGoToNextPage) return;
    const nextPageIndex = state.pageIndex + 1;
    const withNextPage = withPageRequested(state, nextPageIndex, pageSize, itemCount);
    const withPageAfter = nextPageWantedRef.current
      ? withPageRequested(withNextPage, nextPageIndex + 1, pageSize, itemCount)
      : withNextPage;
    setState({ ...withPageAfter, pageIndex: nextPageIndex });
  };

  const goToPreviousPage = () => {
    if (state.pageIndex > 0) setState({ ...state, pageIndex: state.pageIndex - 1 });
  };

  // While the next page is wanted (eg the pointer is resting on a Next button),
  // it's kept loaded, including the one after a page that was just gone to.
  const setNextPageWanted = (wanted: boolean) => {
    nextPageWantedRef.current = wanted;
    if (wanted && canGoToNextPage) {
      setState(withPageRequested(state, state.pageIndex + 1, pageSize, itemCount));
    }
  };

  return {
    pageIndex: state.pageIndex,
    getPage: (pageIndex: number) => getPage(state.pageStarts, pageIndex, { pageSize, itemCount, awaitedItemCount }),
    canGoToNextPage,
    goToNextPage,
    goToPreviousPage,
    setNextPageWanted,
  };
};
