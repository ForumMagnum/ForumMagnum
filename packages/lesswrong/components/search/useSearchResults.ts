import { useCallback, useEffect, useRef, useState } from "react";
import stringify from "json-stringify-deterministic";
import { getSearchClient } from "@/lib/search/searchUtil";
import { isAF } from "@/lib/instanceSettings";
import type { SearchFilterParams } from "@/lib/search/searchFilters";

const pageSize = 20;
// Elasticsearch's default result window. Do not request pages beyond it.
const maxResults = 10000;

export interface SearchBarHit extends SearchDocument {
  objectID: string;
  _index: string;
  _score?: number | null;
}

export interface SearchResultsRequest {
  /** Comma-separated index names; every index in the list is searched together. */
  indexName: string;
  query: string;
  /** Request form of the sort, see formatSearchSort. Absent means ranked by score. */
  sort?: string[];
  filters?: SearchFilterParams;
}

function mergeFacetFilters(filters: SearchFilterParams | undefined): string[][] | undefined {
  const groups = [...(filters?.facetFilters ?? [])];
  if (isAF()) groups.push(["af:true"]);
  return groups.length ? groups : undefined;
}

/**
 * Pages through the unified search for one request. A new request (by value)
 * clears the list and loads its first page; results of a superseded request
 * are dropped.
 */
export function useSearchResults(request: SearchResultsRequest, open: boolean) {
  const [hits, setHits] = useState<SearchBarHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | null>(null);
  const requestKey = stringify(request);
  const latestRequest = useRef(request);
  latestRequest.current = request;
  const pager = useRef({page: 0, loading: false, hasMore: true});

  const loadMore = useCallback(async () => {
    const current = pager.current;
    const {indexName, query, sort, filters} = latestRequest.current;
    if (!open || !indexName || current.loading || !current.hasMore) return;
    current.loading = true;
    setLoading(true);
    setError(false);
    try {
      const facetFilters = mergeFacetFilters(filters);
      const {results} = await getSearchClient({emptyStringSearchResults: "default", unifiedSearch: true})
        .search<SearchBarHit>([{
          indexName,
          query,
          params: {
            query,
            page: current.page,
            hitsPerPage: pageSize,
            // These are the markers parsed by the existing InstantSearch Snippet widgets.
            highlightPreTag: "<ais-highlight-0000000000>",
            highlightPostTag: "</ais-highlight-0000000000>",
            ...(sort && {sort}),
            ...(facetFilters && {facetFilters}),
            ...(filters?.numericFilters && {numericFilters: filters.numericFilters}),
            ...(filters?.tagMatch && {tagMatch: filters.tagMatch}),
            ...(filters?.tagIds && {tagIds: filters.tagIds}),
            ...(filters?.authorIds && {authorIds: filters.authorIds}),
            ...(filters?.postTypes && {postTypes: filters.postTypes}),
          },
        }]);
      if (pager.current !== current) return;
      const result = results[0];
      if (!("hits" in result)) throw new Error("Search returned no results");
      current.page += 1;
      current.hasMore = result.hits.length > 0 && current.page < result.nbPages && current.page * pageSize < maxResults;
      setHits(previous => [...previous, ...result.hits]);
      setTotal(result.nbHits);
      setHasMore(current.hasMore);
    } catch {
      if (pager.current === current) setError(true);
    } finally {
      if (pager.current === current) {
        current.loading = false;
        setLoading(false);
      }
    }
  // The request is read through latestRequest; requestKey captures its value.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, open]);

  useEffect(() => {
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
  }, [requestKey, loadMore]);

  return {hits, loading, error, hasMore, total, loadMore};
}
