import React, { useRef, useEffect } from 'react';
import { ObservableQuery, WatchQueryFetchPolicy } from '@apollo/client';
import { useQuery } from "@/lib/crud/useQuery";
import { useOnPageScroll } from './withOnPageScroll';
import { isClient } from '../../lib/executionEnvironment';
import { useOrderPreservingArray } from '../hooks/useOrderPreservingArray';
import { useTracking } from '@/lib/analyticsEvents';
import Loading from "../vulcan-core/Loading";
import type { VariablesOf } from '@graphql-typed-document-node/core';
import { type ExtractRenderers, type FeedPaginationResultVariables, type FeedQuery } from './feeds/feedQueries';

const defaultLoadMoreDistance = 500;

// An infinitely scrolling feed of elements, which may be of multiple types.
// This should have a corresponding server-side resolver created using
// `defineFeedResolver`.
//
// This displays a list list of items, loading more pages of results when the
// scroll position gets within `loadMoreDistance` pixels of the bottom. This
// uses Apollo's `fetchMore` to handle loading more elements.
//
// Results have type ResultType and are rendered into React elements by the
// renderResult function. If not provided, the results are presumed to be usable
// as React elements as-is (ie, strings).
export const MixedTypeFeed = <
  TQuery extends FeedQuery
>(args: {
  // The pre-built GraphQL query document node
  query: TQuery,
  
  // Variables for the query (excluding pagination variables which are managed internally)
  variables: Omit<VariablesOf<TQuery>, 'cutoff' | 'offset' | 'limit'>,
  
  // Renderers to convert results into React nodes.
  renderers: ExtractRenderers<TQuery>,
  
  // The number of elements on the first page, which is included with SSR.
  firstPageSize?: number,
  
  // The number of elements per page, on pages other than the first page.
  pageSize?: number,
  
  // Ref that will be populated with a function that makes this feed refetch
  // (refetching everything, shrinking it to one page, and potentially scrolling
  // up by a bunch.)
  refetchRef?: {current: null|ObservableQuery['refetch']},

  // By default, MixedTypeFeed preserves the order of elements that persist across refetches.  If you don't want that, pass in true.
  reorderOnRefetch?: boolean,

  // Hide the loading spinner
  hideLoading?: boolean,

  // Disable automatically loading more - only show the initially fetched documents
  disableLoadMore?: boolean,

  className?: string,

  // Distance from bottom of viewport to trigger loading more items
  loadMoreDistanceProp?: number,

  // Apollo fetch policy
  fetchPolicy?: WatchQueryFetchPolicy;
}) => {
  const {
    query,
    variables,
    renderers,
    firstPageSize=20,
    pageSize=20,
    refetchRef,
    reorderOnRefetch=false,
    hideLoading,
    disableLoadMore,
    className,
    loadMoreDistanceProp = defaultLoadMoreDistance,
    fetchPolicy = "cache-and-network",
  } = args;

  // Reference to a bottom-marker used for checking scroll position.
  const bottomRef = useRef<HTMLDivElement|null>(null);
  
  // Whether there is a pending query. This is indirect (inside an object)
  // because it's accessed from inside callbacks, where the timing of state
  // updates would be a problem.
  const queryIsPending = useRef(false);
  const {captureEvent} = useTracking();
  
  const {data, error, fetchMore, refetch} = useQuery<Record<string, FeedPaginationResultVariables>>(query, {
    variables: {
      ...variables,
      cutoff: null,
      offset: 0,
      limit: firstPageSize,
    },
    fetchPolicy,
    nextFetchPolicy: "cache-only",
    ssr: true,
  });
  
  if (refetchRef && refetch)
    refetchRef.current = refetch;
  
  // Extract the resolver name from the data (should be the single top-level field apart from __typename)
  const resolverName = data ? Object.keys(data).filter(key => key !== '__typename')[0] : null;

  // Whether we've reached the end. The end-marker is when a query returns null
  // for the cutoff.
  const reachedEnd = (data && resolverName && data[resolverName] && !data[resolverName].cutoff);
  
  const keyFunc = (result: any) => `${result.type}_${result[result.type]?._id}`; // Get a unique key for each result. Used for sorting and deduplication.

  // maybeStartLoadingMore: Test whether the scroll position is close enough to
  // the bottom that we should start loading the next page, and if so, start loading it.
  const maybeStartLoadingMore = () => {
    // Client side, scrolled to near the bottom? Start loading if we aren't loading already.
    if (isClient
      && bottomRef?.current
      && elementIsNearVisible(bottomRef?.current, loadMoreDistanceProp)
      && !reachedEnd
      && data
      && resolverName)
    {
      if (!queryIsPending.current) {
        queryIsPending.current = true;
        void fetchMore({
          variables: {
            ...variables,
            cutoff: data[resolverName].cutoff,
            offset: data[resolverName].endOffset,
            limit: pageSize,
          },
          updateQuery: (prev, {fetchMoreResult}: {fetchMoreResult: any}) => {
            queryIsPending.current = false;
            if (!fetchMoreResult || !resolverName) {
              return prev;
            }

            // Deduplicate by removing repeated results from the newly fetched page. Ideally we
            // would use cursor-based pagination to avoid this
            const prevKeys = new Set(prev[resolverName].results?.map(keyFunc));
            const newResults = fetchMoreResult[resolverName].results;
            const deduplicatedResults = newResults.filter((result: any) => !prevKeys.has(keyFunc(result)));
            
            // If the server sent back data, but none of it was new after deduplication, 
            // treat it as the end of the feed by setting cutoff to null. This shouldn't happen though.
            const newCutoff = (newResults.length > 0 && deduplicatedResults.length === 0) ? null : fetchMoreResult[resolverName].cutoff;

            return {
              [resolverName]: {
                __typename: fetchMoreResult[resolverName].__typename,
                cutoff: newCutoff,
                endOffset: fetchMoreResult[resolverName].endOffset,
                results: [...prev[resolverName].results ?? [], ...deduplicatedResults],
              }
            };
          }
        });
      }
    }
  }

  // Load-more triggers. Check (1) after render, and (2) when the page is scrolled.
  // We *don't* check inside handleLoadFinished, because that's before the results
  // have been attached to the DOM, so we can''t test whether they reach the bottom.
  useEffect(maybeStartLoadingMore);
  useOnPageScroll(maybeStartLoadingMore);
  
  const results = (data && resolverName && data[resolverName]?.results) || [];

  // Log items that appear more than once in the same result set (should be impossible) TODO: clean up once issues are fixed
  results.reduce((keysSeen, r) => {
    const k = keyFunc(r);
    keysSeen.has(k)
      ? captureEvent?.("ultraFeedDuplicateDetected", { key: k, resolverName, duplicateStage: "client-render" })
      : keysSeen.add(k);
    return keysSeen;
  }, new Set<string>());

  const orderPolicy = reorderOnRefetch ? 'no-reorder' : undefined;
  const orderedResults = useOrderPreservingArray(results, keyFunc, orderPolicy);

  return <div className={className}>
    {orderedResults.map((result, index) =>
      <div key={keyFunc(result)}>
        <RenderFeedItem renderers={renderers} item={result} index={index}/>
      </div>
    )}

    {!disableLoadMore && <div ref={bottomRef}/>}
    {error && <div>{error.toString()}</div>}
    {!hideLoading && !reachedEnd && <Loading/>}
  </div>
}

// Render an item in a mixed-type feed. This component is mainly just here to
// have a React.memo wrapper around it, so that users of the component don't
// have to carefully memoize every feed item type individually.
const RenderFeedItem = React.memo(({renderers, item, index}: {
  renderers: any,
  item: any,
  index?: number
}) => {
  const renderFn = renderers[item.type]?.render;
  return renderFn ? renderFn(item[item.type], index) : item[item.type];
});

// Returns whether an element, which is presumed to be either visible or below
// the screen, is within `distance` of being visible. This is used for infinite
// scroll; the next segment starts loading when the scroll position reaches
// `distance` of the bottom.
function elementIsNearVisible(element: HTMLElement|null, distance: number) {
  if (!element) return false;
  const top = element.getBoundingClientRect().y;
  const windowHeight = window.innerHeight;
  return (top-distance) <= windowHeight;
}


