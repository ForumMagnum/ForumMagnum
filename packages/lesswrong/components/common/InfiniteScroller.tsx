import React, { useState, useMemo, useCallback, useRef, useEffect, ReactNode } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useOnPageScroll } from './withOnPageScroll';

const loadMoreDistance = 200;

export interface FeedRequest<CutoffType> {
  cutoff: CutoffType|null,
  limit: number,
}
export interface FeedResponse<CutoffType, ResultType> {
  results: Array<ResultType>,
  error: any,
  cutoff: CutoffType|null,
}
export type FeedLoaderComponent<CutoffType, ResultType> = (props: {
  request: FeedRequest<CutoffType>,
  onLoadFinished: (result: FeedResponse<CutoffType, ResultType>) => void
}) => null;

// Infinite scroller. This generates a list list of items, loading more pages of
// results when the scroll position gets within `loadMoreDistance` pixels of the
// bottom. In most cases this will be used indirectly, via a wrapper like
// MixedTypeFeed, which defines what the actual elements are.
//
// The architecture of this is largely driven by Apollo, and in particular by
// the awkward fact that Apollo queries work by having hooks with a fixed query,
// and varying what query is to be run, means also varying what is attached to
// the DOM.
//
// Pages boundaries are marked by a cutoff, of type CutoffType. In the common
// case of a list sorted by date, the cutoff is the date of the last item in
// the page; the next page will have results less-or-equal than it. As a special
// case, a cutoff of null means either the first page (if attached to a query),
// or means there are no results remaining (if attached to a response).
//
// The first page of results is handled separately, for SSR reasons; this
// component should not be instantiated until the first page is already loaded.
// Subsequent pages are loaded using LoaderComponent, which is a component that
// is attached to the DOM when a page of results is being requested, and
// executes a callback once when that page of results is available.
//
// Results have type ResultType and are rendered into React elements by the
// renderResult function. If not provided, the results are presumed to be usable
// as React elements as-is.
const InfiniteScroller = <CutoffType extends any, ResultType extends any>({firstPage, LoaderComponent, renderResult, endReached, pageSize=50}: {
  firstPage: FeedResponse<CutoffType,ResultType>,
  LoaderComponent: FeedLoaderComponent<CutoffType,ResultType>,
  renderResult?: (result: ResultType) => ReactNode,
  endReached?: ReactNode,
  pageSize?: number,
}) => {
  console.log(`In InfiniteScroller; firstPage ${firstPage?'provided':'absent'}`);
  const [pendingQuery, setPendingQuery] = useState<FeedRequest<CutoffType>|null>(null);
  const [resultPages, setResultPages] = useState<ResultType[][]>([]);
  const [cutoff, setCutoff] = useState<CutoffType|null>(firstPage.cutoff);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [error, setError] = useState<any>(firstPage?.error || null);
  const bottomRef = useRef<HTMLDivElement|null>(null);
  
  const { Loading } = Components;
  
  // handleLoadFinished: Called when a page of results comes back, to add to the
  // bottom of the feed.
  const handleLoadFinished = useCallback((response: FeedResponse<CutoffType,ResultType>) => {
    if (response.results?.length > 0) {
      const newResultPages = [...resultPages, response.results];
      // unstable_batchedUpdates: Group this set of state changes into a single
      // update, because otherwise React will rerender this three times instead of
      // once. React roadmap indicates that in a future version, they'll just get
      // grouped automagically and this function wrapper won't be necessary
      // anymore, so if a React update turns this function into an error, you can
      // probably just unwrap this.
      unstable_batchedUpdates(() => {
        setPendingQuery(null);
        setResultPages(newResultPages);
        setCutoff(response.cutoff);
      });
    } else if (response.error) {
      unstable_batchedUpdates(() => {
        setError(response.error);
        setPendingQuery(null);
        setReachedEnd(true);
      });
    } else {
      unstable_batchedUpdates(() => {
        setPendingQuery(null);
        setReachedEnd(true);
      });
    }
  }, [resultPages]);
  
  const loaderComponentInstance = useMemo(() => 
    pendingQuery && <LoaderComponent
      request={pendingQuery}
      onLoadFinished={handleLoadFinished}
    />,
    [pendingQuery, handleLoadFinished]
  );
  
  // startLoadingMore: Ask for another page of results. If a load is already
  // pending, does nothing.
  const startLoadingMore = useCallback(() => {
    if (!pendingQuery) {
      console.log(`Setting pending query with cutoff: ${cutoff}`);
      setPendingQuery({cutoff, limit: pageSize});
    }
  }, [cutoff, pageSize, pendingQuery]);
  
  // maybeStartLoadingMore: Test whether the scroll position is close enough to
  // the bottom that we should start loading the next page, and if so, start
  // loading it.
  const maybeStartLoadingMore = useCallback(() => {
    // Client side, scrolled to near the bottom? Start loading if we aren't loading already.
    if (Meteor.isClient
      && bottomRef?.current
      && elementIsNearVisible(bottomRef?.current, loadMoreDistance))
    {
      console.log("Loading more because the bottom is visible");
      startLoadingMore();
    }
  }, [startLoadingMore]);
  
  // Load-more triggers. Check (1) after render, and (2) when the page is scrolled.
  // We *don't* check inside handleLoadFinished, because that's before the results
  // have been attached to the DOM, so we can''t test whether they reach the bottom.
  useEffect(maybeStartLoadingMore);
  useOnPageScroll(maybeStartLoadingMore);
  
  console.log(`Rendering ${1+resultPages.length} pages`);
  const result = <div>
    <InfiniteScrollSegment key={`results-firstPage`} page={firstPage.results} renderResult={renderResult}/>
    
    {resultPages.map((resultPage: ResultType[], pageIndex: number) =>
      <InfiniteScrollSegment key={`results-${pageIndex}`} page={resultPage} renderResult={renderResult}/>
    )}
    
    {pendingQuery && <Loading/>}
    
    {!reachedEnd && !pendingQuery && <div ref={bottomRef}/>}
    
    {error && <div>
      {error}
    </div>}
    
    {reachedEnd && <div>
      {endReached}
    </div>}
    
    {pendingQuery && loaderComponentInstance}
  </div>
  console.log("Finished InfiniteScroller");
  return result;
}

const InfiniteScrollSegment = <ResultType extends any>({page, renderResult}: {
  page: ResultType[]
  renderResult: any
}) => {
  return useMemo(() => <div>
    {page.map((result: ResultType, resultIndex: number) =>
      <div key={resultIndex} className="feedItem">
        {renderResult ? renderResult(result) : result}
      </div>
    )}
  </div>, [page, renderResult]);
}

// Returns whether an element, which is presumed to be either visible or below
// the screen, is within `distance` of being visible. This is used for infinite
// scroll; the next segment starts loading when the scroll position reaches
// `distance` of the bottom.
function elementIsNearVisible(element: HTMLElement, distance: number) {
  const top = element.getBoundingClientRect().y;
  const windowHeight = window.innerHeight;
  return (top-distance) <= windowHeight;
}

const InfiniteScrollerComponent = registerComponent('InfiniteScroller', InfiniteScroller);

declare global {
  interface ComponentTypes {
    InfiniteScroller: typeof InfiniteScrollerComponent
  }
}
