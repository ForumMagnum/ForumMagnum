import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import stringify from "json-stringify-deterministic";
import { getSearchClient } from "@/lib/search/searchUtil";
import { isAF } from "@/lib/instanceSettings";
import type { SearchFilterParams } from "@/lib/search/searchFilters";

const pageSize = 20;
const maxResults = 10000;

export interface SearchBarHit extends SearchDocument {
  objectID: string;
  _index: string;
  _score?: number | null;
}

export interface SearchResultsRequest {
  indexName: string;
  query: string;
  filters: SearchFilterParams;
}

export function useSearchResults(request: SearchResultsRequest) {
  const [hits, setHits] = useState<SearchBarHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | null>(null);
  const requestKey = stringify(request);
  const latestRequest = useRef(request);
  const pager = useRef({page: 0, loading: false, hasMore: true});

  const loadMore = useCallback(async () => {
    const current = pager.current;
    const {indexName, query, filters: {withinMs, facetFilters = [], numericFilters = [], ...filters}} = latestRequest.current;
    if (!indexName || current.loading || !current.hasMore) return;
    current.loading = true;
    setLoading(true);
    setError(false);
    try {
      const {results} = await getSearchClient({emptyStringSearchResults: "default", mode: "unified"})
        .search<SearchBarHit>([{
          indexName,
          query,
          params: {
            query,
            page: current.page,
            hitsPerPage: pageSize,
            highlightPreTag: "<ais-highlight-0000000000>",
            highlightPostTag: "</ais-highlight-0000000000>",
            ...filters,
            facetFilters: isAF() ? [...facetFilters, ["af:true"]] : facetFilters,
            // A relative timeframe counts back from the moment of the request
            numericFilters: withinMs === undefined ? numericFilters : [...numericFilters, `publicDateMs>=${Date.now() - withinMs}`],
          },
        }]);
      if (pager.current !== current) return;
      const result = results[0];
      if (!("hits" in result)) throw new Error("Search returned no results");
      current.page += 1;
      current.hasMore = result.hits.length > 0 && current.page < result.nbPages && current.page * pageSize < maxResults;
      startTransition(() => {
        setHits(previous => [...previous, ...result.hits]);
        setTotal(result.nbHits);
        setHasMore(current.hasMore);
      });
    } catch {
      if (pager.current === current) setError(true);
    } finally {
      if (pager.current === current) {
        current.loading = false;
        startTransition(() => setLoading(false));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  useEffect(() => {
    latestRequest.current = request;
    pager.current = {page: 0, loading: false, hasMore: true};
    setHits([]);
    setTotal(null);
    setHasMore(!!latestRequest.current.indexName);
    setError(false);
    setLoading(false);
    void loadMore();
    return () => {
      pager.current = {...pager.current};
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, loadMore]);

  return {hits, loading, error, hasMore, total, loadMore};
}
