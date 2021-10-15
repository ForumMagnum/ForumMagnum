import React, { useRef, useEffect } from 'react';
import { fragmentTextForQuery, registerComponent, Components } from '../../lib/vulcan-lib';
import { useQuery, gql } from '@apollo/client';
import { useOnPageScroll } from './withOnPageScroll';
import { isClient } from '../../lib/executionEnvironment';
import * as _ from 'underscore';

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
  const fragmentsUsed = _.filter(Object.keys(renderers).map(r => renderers[r].fragmentName), f=>f);
  const queryArgsList=["$limit: Int", "$cutoff: Date", "$offset: Int",
    ...(resolverArgs ? Object.keys(resolverArgs).map(k => `$${k}: ${resolverArgs[k]}`) : []),
    ...(fragmentArgs ? Object.keys(fragmentArgs).map(k => `$${k}: ${fragmentArgs[k]}`) : []),
  ];
  const resolverArgsList=["limit: $limit", "cutoff: $cutoff", "offset: $offset",
    ...(resolverArgs ? Object.keys(resolverArgs).map(k => `${k}: $${k}`) : []),
  ];
  
  return gql`
    query ${resolverName}Query(${queryArgsList.join(", ")}) {
      ${resolverName}(${resolverArgsList.join(", ")}) {
        __typename
        cutoff
        endOffset
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
  refetchRef?: {current: null|(()=>void)},
}) => {
  const { resolverName, resolverArgs=null, resolverArgsValues=null, fragmentArgs=null, fragmentArgsValues=null, sortKeyType, renderers, firstPageSize=20, pageSize=20, refetchRef } = args;
  
  // Reference to a bottom-marker used for checking scroll position.
  const bottomRef = useRef<HTMLDivElement|null>(null);
  
  // Whether there is a pending query. This is indirect (inside an object)
  // because it's accessed from inside callbacks, where the timing of state
  // updates would be a problem.
  const queryIsPending = useRef(false);
  
  const {Loading} = Components;
  
  const query = getQuery({resolverName, resolverArgs, fragmentArgs, sortKeyType, renderers});
  const {data, error, fetchMore, refetch} = useQuery(query, {
    variables: {
      ...resolverArgsValues,
      ...fragmentArgsValues,
      cutoff: null,
      offset: 0,
      limit: firstPageSize,
    },
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-only",
    ssr: true,
  });
  
  if (refetchRef && refetch)
    refetchRef.current = refetch;
  
  // Whether we've reached the end. The end-marker is when a query returns null
  // for the cutoff.
  const reachedEnd = (data && data[resolverName] && !data[resolverName].cutoff);
  
  // maybeStartLoadingMore: Test whether the scroll position is close enough to
  // the bottom that we should start loading the next page, and if so, start
  // loading it.
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
          },
          updateQuery: (prev, {fetchMoreResult}: {fetchMoreResult: any}) => {
            queryIsPending.current = false;
            if (!fetchMoreResult) {
              return prev;
            }
            
            return {
              [resolverName]: {
                __typename: fetchMoreResult[resolverName].__typename,
                cutoff: fetchMoreResult[resolverName].cutoff,
                endOffset: data[resolverName].endOffset,
                results: [...prev[resolverName].results, ...fetchMoreResult[resolverName].results],
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
  return <div>
    {data && data[resolverName]?.results && data[resolverName].results.map((result,i) =>
      <div key={i}>
        <RenderFeedItem renderers={renderers} item={result}/>
      </div>
    )}
    
    <div ref={bottomRef}/>
    {error && <div>{error.toString()}</div>}
    {!reachedEnd && <Loading/>}
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

