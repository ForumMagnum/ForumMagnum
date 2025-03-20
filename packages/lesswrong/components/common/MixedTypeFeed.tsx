import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useQuery, gql, ObservableQuery } from '@apollo/client';
import { useOnPageScroll } from './withOnPageScroll';
import { isClient } from '../../lib/executionEnvironment';
import { useOrderPreservingArray } from '../hooks/useOrderPreservingArray';
import { fragmentTextForQuery } from "../../lib/vulcan-lib/fragments";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";

const loadMoreDistance = 500;

export interface FeedRequest<CutoffType> {
  cutoff: CutoffType|null,
  limit: number,
}
export interface FeedResponse<CutoffType, ResultType> {
  results: Array<ResultType>,
  error: any,
  cutoff: CutoffType|null,
}

const getQuery = ({resolverName, resolverArgs, fragmentArgs, sortKeyType, renderers}: {
  resolverName: string,
  resolverArgs: any,
  fragmentArgs: any,
  sortKeyType: string,
  renderers: any,
}) => {
  const fragmentsUsed = Object.keys(renderers).map(r => renderers[r].fragmentName).filter(f=>f);
  
  const queryArgsList=[
    "$limit: Int", 
    `$cutoff: ${sortKeyType}`, 
    "$offset: Int", 
    "$sessionId: String", // Optional sessionId parameter
    ...(resolverArgs ? Object.keys(resolverArgs).map(k => `$${k}: ${resolverArgs[k]}`) : []),
    ...(fragmentArgs ? Object.keys(fragmentArgs).map(k => `$${k}: ${fragmentArgs[k]}`) : []),
  ];
  
  const resolverArgsList=[
    "limit: $limit", 
    "cutoff: $cutoff", 
    "offset: $offset", 
    "sessionId: $sessionId", // Will be null if not provided
    ...(resolverArgs ? Object.keys(resolverArgs).map(k => `${k}: $${k}`) : []),
  ];

  return gql`
    query ${resolverName}Query(${queryArgsList.join(", ")}) {
      ${resolverName}(${resolverArgsList.join(", ")}) {
        __typename
        cutoff
        endOffset
        sessionId
        results {
          type
          ${Object.keys(renderers).map(rendererName =>
            renderers[rendererName].fragmentName
              ? `${rendererName} { ...${renderers[rendererName].fragmentName} }`
              : ''
          )}
        }
      }
    }
    ${fragmentTextForQuery(fragmentsUsed)}
  `
}

interface FeedRenderer<FragmentName extends keyof FragmentTypes> {
  fragmentName: FragmentName,
  render: (result: FragmentTypes[FragmentName]) => React.ReactNode,
}

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
const MixedTypeFeed = (args: {
  resolverName: string,
  
  // Types for parameters given to the resolver, as an object mapping from
  // argument names to graphQL type strings.
  resolverArgs?: Partial<Record<string,string>>,
  
  // Values for parameters given to the resolver, as an object mapping
  // from argument names to graphQL type strings.
  resolverArgsValues?: Partial<Record<string,any>>,
  
  // Types for extra arguments used in result fragments, as an object mapping
  // from argument names to graphQL type strings.
  fragmentArgs?: Partial<Record<string,string>>,
  
  // Values for extra arguments used in result fragments, as an object mapping
  // from argument names to argument values.
  fragmentArgsValues?: Partial<Record<string,any>>,
  
  // GraphQL name of the type results are sorted by.
  sortKeyType: string,
  
  // Renderers to convert results into React nodes.
  renderers: Partial<Record<string,FeedRenderer<any>>>,
  
  // The number of elements on the first page, which is included with SSR.
  firstPageSize?: number,
  
  // The number of elements per page, on pages other than the first page.
  pageSize?: number,
  
  // Ref that will be populated with a function that makes this feed refetch
  // (refetching everything, shrinking it to one page, and potentially scrolling
  // up by a bunch.)
  refetchRef?: {current: null|ObservableQuery['refetch']},
  
  // Ref that will be populated with the loadMoreAtTop function
  loadMoreRef?: {current: null|(() => void)},

  // By default, MixedTypeFeed preserves the order of elements that persist across refetches.  If you don't want that, pass in true.
  reorderOnRefetch?: boolean,

  // Hide the loading spinner
  hideLoading?: boolean,

  // Disable automatically loading more - only show the initially fetched documents
  disableLoadMore?: boolean,
  
  // Load more content at the top instead of bottom (with a button instead of infinite scroll)
  prependedLoadMore?: boolean,
  
  // Callback when the feed has reached the end of results
  onReachedEnd?: (isAtEnd: boolean) => void,
  
  className?: string,
}) => {
  const {
    resolverName,
    resolverArgs=null,
    resolverArgsValues=null,
    fragmentArgs=null,
    fragmentArgsValues=null,
    sortKeyType,
    renderers,
    firstPageSize=20,
    pageSize=20,
    refetchRef,
    loadMoreRef,
    reorderOnRefetch=false,
    hideLoading,
    disableLoadMore,
    prependedLoadMore=false,
    onReachedEnd,
    className,
  } = args;

  // Reference to a bottom-marker used for checking scroll position.
  const bottomRef = useRef<HTMLDivElement|null>(null);
  
  // Whether there is a pending query. This is indirect (inside an object)
  // because it's accessed from inside callbacks, where the timing of state
  // updates would be a problem.
  const queryIsPending = useRef(false);
  
  // State to track if more content is being loaded for the prepended case
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const {Loading} = Components;
  
  const query = getQuery({resolverName, resolverArgs, fragmentArgs, sortKeyType, renderers});
  const {data, error, fetchMore, refetch} = useQuery(query, {
    variables: {
      ...resolverArgsValues,
      ...fragmentArgsValues,
      cutoff: null,
      offset: 0,
      limit: firstPageSize,
      sessionId: resolverArgsValues?.sessionId || null,
    },
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-only",
    ssr: true,
  });
  
  if (refetchRef && refetch)
    refetchRef.current = refetch;
  
  // Whether we've reached the end. The end-marker is when a query returns null
  // for the cutoff.
  const hasResults = data && data[resolverName]?.results?.length > 0;
  const reachedEnd = prependedLoadMore 
    ? (data && data[resolverName] && !hasResults) // For prepended mode, we've reached the end if there are no results
    : (data && data[resolverName] && !data[resolverName].cutoff); // Standard end detection
  
  console.log("MixedTypeFeed render state", {
    resolverName,
    dataExists: !!data,
    resolverData: data?.[resolverName],
    cutoff: data?.[resolverName]?.cutoff,
    reachedEnd,
    hasResults,
    resultsCount: data?.[resolverName]?.results?.length || 0,
    sessionId: resolverArgsValues?.sessionId 
  });
  
  const keyFunc = useCallback((result: any) => `${result.type}_${result[result.type]?._id}`, []); // Get a unique key for each result. Used for sorting and deduplication.

  // Function to load more content at the top
  const loadMoreAtTop = useCallback(() => {
    console.log("loadMoreAtTop called", { 
      dataExists: !!data, 
      reachedEnd, 
      isPending: queryIsPending.current,
      cutoff: data?.[resolverName]?.cutoff,
      endOffset: data?.[resolverName]?.endOffset,
      sessionId: resolverArgsValues?.sessionId
    });
    
    if (!data || queryIsPending.current) return;
    
    setIsLoadingMore(true);
    queryIsPending.current = true;
    
    console.log("Calling fetchMore with variables", {
      cutoff: data[resolverName].cutoff,
      offset: data[resolverName].endOffset,
      limit: pageSize,
      sessionId: resolverArgsValues?.sessionId // Only log the prop
    });
    
    void fetchMore({
      variables: {
        ...resolverArgsValues,
        ...fragmentArgsValues,
        cutoff: data[resolverName].cutoff,
        offset: data[resolverName].endOffset,
        limit: pageSize,
        sessionId: resolverArgsValues?.sessionId || null,
      },
      updateQuery: (prev, {fetchMoreResult}: {fetchMoreResult: any}) => {
        console.log("fetchMore updateQuery callback", { 
          hasResult: !!fetchMoreResult,
          prevResultsCount: prev[resolverName].results.length,
          newResultsCount: fetchMoreResult?.[resolverName]?.results?.length || 0,
          newCutoff: fetchMoreResult?.[resolverName]?.cutoff
        });
        
        queryIsPending.current = false;
        setIsLoadingMore(false);
        
        if (!fetchMoreResult || !fetchMoreResult[resolverName]?.results?.length) {
          // If we got no results, treat it as reaching the end
          return {
            ...prev,
            [resolverName]: {
              ...prev[resolverName],
              // Mark as having reached the end to prevent more requests
              cutoff: null
            }
          };
        }

        // Deduplicate by removing repeated results from the newly fetched page
        const prevKeys = new Set(prev[resolverName].results.map(keyFunc));
        const newResults = fetchMoreResult[resolverName].results;
        const deduplicatedResults = newResults.filter((result: any) => !prevKeys.has(keyFunc(result)));
        
        console.log("After deduplication", {
          originalNewResults: newResults.length,
          deduplicatedResults: deduplicatedResults.length
        });
        
        return {
          [resolverName]: {
            __typename: fetchMoreResult[resolverName].__typename,
            cutoff: fetchMoreResult[resolverName].cutoff,
            endOffset: fetchMoreResult[resolverName].endOffset,
            sessionId: fetchMoreResult[resolverName]?.sessionId, // Keep sessionId from response
            results: [...deduplicatedResults, ...prev[resolverName].results],
          }
        };
      }
    }).catch(error => {
      console.error("Error in fetchMore:", error);
      queryIsPending.current = false;
      setIsLoadingMore(false);
    });
  }, [data, reachedEnd, queryIsPending, resolverName, pageSize, resolverArgsValues, fragmentArgsValues, fetchMore, keyFunc]);
  
  // Assign loadMoreAtTop to the ref
  if (loadMoreRef) {
    loadMoreRef.current = loadMoreAtTop;
  }

  // maybeStartLoadingMore: Test whether the scroll position is close enough to
  // the bottom that we should start loading the next page, and if so, start loading it.
  const maybeStartLoadingMore = () => {
    // Client side, scrolled to near the bottom? Start loading if we aren't loading already.
    if (isClient
      && bottomRef?.current
      && elementIsNearVisible(bottomRef?.current, loadMoreDistance)
      && !reachedEnd
      && data)
    {
      if (!queryIsPending.current) {
        queryIsPending.current = true;
        void fetchMore({
          variables: {
            ...resolverArgsValues,
            ...fragmentArgsValues,
            cutoff: data[resolverName].cutoff,
            offset: data[resolverName].endOffset,
            limit: pageSize,
            sessionId: resolverArgsValues?.sessionId || null,
          },
          updateQuery: (prev, {fetchMoreResult}: {fetchMoreResult: any}) => {
            queryIsPending.current = false;
            if (!fetchMoreResult) {
              return prev;
            }

            // Deduplicate by removing repeated results from the newly fetched page. Ideally we
            // would use cursor-based pagination to avoid this
            const prevKeys = new Set(prev[resolverName].results.map(keyFunc));
            const newResults = fetchMoreResult[resolverName].results;
            const deduplicatedResults = newResults.filter((result: any) => !prevKeys.has(keyFunc(result)));
            
            return {
              [resolverName]: {
                __typename: fetchMoreResult[resolverName].__typename,
                cutoff: fetchMoreResult[resolverName].cutoff,
                endOffset: fetchMoreResult[resolverName].endOffset,
                sessionId: fetchMoreResult[resolverName]?.sessionId, // Keep sessionId from response
                results: [...prev[resolverName].results, ...deduplicatedResults],
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
  useEffect(() => {
    // Only set up infinite scroll if not using prepended load more
    if (!prependedLoadMore) {
      maybeStartLoadingMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prependedLoadMore]);
  
  useOnPageScroll(() => {
    // Only monitor scroll if not using prepended load more
    if (!prependedLoadMore) {
      maybeStartLoadingMore();
    }
  });
  
  const results = (data && data[resolverName]?.results) || [];
  const orderPolicy = reorderOnRefetch ? 'no-reorder' : undefined;
  const orderedResults = useOrderPreservingArray(results, keyFunc, orderPolicy);
  
  useEffect(() => {
    if (onReachedEnd) {
      onReachedEnd(reachedEnd);
    }
  }, [onReachedEnd, reachedEnd]);
  
  return <div className={className}>
    {/* Loading indicator at the top when loading more in prepended mode */}
    {prependedLoadMore && isLoadingMore && (
      <div style={{ textAlign: 'center', margin: '10px 0' }}>
        <Loading />
      </div>
    )}
    
    {orderedResults.map((result) =>
      <div key={keyFunc(result)}>
        <RenderFeedItem renderers={renderers} item={result}/>
      </div>
    )}

    {!disableLoadMore && !prependedLoadMore && <div ref={bottomRef}/>}
    {error && <div>{error.toString()}</div>}
    {!hideLoading && !prependedLoadMore && !reachedEnd && <Loading/>}
  </div>
}

// Render an item in a mixed-type feed. This component is mainly just here to
// have a React.memo wrapper around it, so that users of the component don't
// have to carefully memoize every feed item type individually.
const RenderFeedItem = React.memo(({renderers, item}: {
  renderers: any,
  item: any
}) => {
  const renderFn = renderers[item.type]?.render;
  return renderFn ? renderFn(item[item.type]) : item[item.type];
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

const MixedTypeInfiniteComponent = registerComponent('MixedTypeFeed', MixedTypeFeed);

declare global {
  interface ComponentTypes {
    MixedTypeFeed: typeof MixedTypeInfiniteComponent,
  }
}
