import { useCallback, useEffect, useRef, useState } from "react";
import { getSearchClient } from "@/lib/search/searchUtil";
import { isAF } from "@/lib/instanceSettings";

const pageSize = 20;
// Elasticsearch's default result window. Do not request pages beyond it.
const maxResults = 10000;

export interface SearchBarHit extends SearchDocument {
  objectID: string;
  _index: string;
}

export function useSearchBarResults(indexName: string, query: string, open: boolean) {
  const [hits, setHits] = useState<SearchBarHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const request = useRef({page: 0, loading: false, hasMore: true});

  const loadMore = useCallback(async () => {
    const current = request.current;
    if (!open || !indexName || current.loading || !current.hasMore) return;
    current.loading = true;
    setLoading(true);
    setError(false);
    try {
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
            ...(isAF() && {facetFilters: [["af:true"]]}),
          },
        }]);
      if (request.current !== current) return;
      const result = results[0];
      if (!("hits" in result)) throw new Error("Search returned no results");
      current.page += 1;
      current.hasMore = result.hits.length > 0 && current.page < result.nbPages && current.page * pageSize < maxResults;
      setHits(previous => [...previous, ...result.hits]);
      setHasMore(current.hasMore);
    } catch {
      if (request.current === current) setError(true);
    } finally {
      if (request.current === current) {
        current.loading = false;
        setLoading(false);
      }
    }
  }, [indexName, query, open]);

  useEffect(() => {
    request.current = {page: 0, loading: false, hasMore: true};
    setHits([]);
    setHasMore(!!indexName);
    setError(false);
    setLoading(false);
    void loadMore();
    return () => {
      request.current = {...request.current};
    };
  }, [indexName, query, loadMore]);

  return {hits, loading, error, hasMore, loadMore};
}
