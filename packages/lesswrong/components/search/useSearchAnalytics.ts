import { useRef, useCallback } from "react";
import { useTracking } from "../../lib/analyticsEvents";
import type { SearchIndexCollectionName } from "@/lib/search/searchUtil";

/**
 * A new search state is generated each time the user types a character.
 * Ideally, we don't want to capture a search event for every single
 * character that is typed - we just want the final, fully-typed search
 * query.
 * To do this we add a short timeout and only create the analytics event
 * after the user has stopped typing.
 */
export const useSearchAnalytics = (timeoutMS = 1000) => {
  const {captureEvent} = useTracking();
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const captureSearch = useCallback(
    (context: string, searchState: Record<string, unknown>) => {
      clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        captureEvent("search", {context, ...searchState});
      }, timeoutMS);
    },
    [captureEvent, timeoutMS],
  );
  return captureSearch;
}

export interface SearchResultSelectedProps {
  query?: string;
  resultId?: string;
  resultType?: SearchIndexCollectionName | string;
  position?: number;
  indexName?: string;
  context: string;
  marker?: string;
}

// Returns a handler for <InstantSearch onSearchStateChange={...}>. Only fires when
// the query actually changes, so pagination/facet state changes don't reset the
// useSearchAnalytics 1s debounce or produce duplicate events.
export function useCaptureSearchStateChange(
  context: string,
  resultType: SearchIndexCollectionName,
  indexName: string,
) {
  const captureSearch = useSearchAnalytics();
  const lastQueryRef = useRef<string | undefined>(undefined);
  return useCallback((searchState: { query?: string }) => {
    if (searchState.query === lastQueryRef.current) return;
    lastQueryRef.current = searchState.query;
    if (searchState.query) {
      captureSearch(context, { query: searchState.query, resultType, indexName });
    }
  }, [captureSearch, context, resultType, indexName]);
}

export function useCaptureSearchResultSelected() {
  const { captureEvent } = useTracking();
  return useCallback((props: SearchResultSelectedProps) => {
    captureEvent("searchResultSelected", props);
  }, [captureEvent]);
}
