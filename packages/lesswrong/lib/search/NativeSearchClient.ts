import type { Client, Index } from "algoliasearch/lite";
import type { MultiResponse, QueryParameters, SearchForFacetValues } from "algoliasearch";
import stringify from "json-stringify-deterministic";
import LRU from "lru-cache";
import { z } from "zod";

/**
 * The is the schema of the request sent from the InstantSearch frontend to
 * Algolia, and we implement this same interface in Elasticsearch.
 */
export const querySchema = z.object({
  indexName: z.string(),
  params: z.object({
    query: z.optional(z.string()),
    highlightPreTag: z.optional(z.string()),
    highlightPostTag: z.optional(z.string()),
    hitsPerPage: z.optional(z.number().int().nonnegative()),
    page: z.optional(z.number().int().nonnegative()),
    facetFilters: z.optional(z.array(z.array(z.string()))),
    numericFilters: z.optional(z.array(z.string())),
    existsFilters: z.optional(z.array(z.string())),
    aroundLatLng: z.optional(z.string()),
  }),
});

const searchOptionsSchema = z.object({
  emptyStringSearchResults: z.union([z.literal("default"), z.literal("empty")]),
});
export type SearchOptions = z.infer<typeof searchOptionsSchema>;

export const queryRequestSchema = z.union([
  z.array(querySchema),
  z.object({
    options: searchOptionsSchema,
    queries: z.array(querySchema),
  }),
]);

export type SearchQuery = z.infer<typeof querySchema>;

// Papering over an incorrect type annotation upstream in a library somewhere. The query is inside of `params`, not outside, but the `Client` interface things it's outside.
type NativeSearchClientSearchQuery = SearchQuery & {
  query: string
}

class NativeSearchClient implements Client {
  private headers: Record<string, string> = {};
  private cache = new LRU<string, Promise<MultiResponse<unknown>>>();
  private options: SearchOptions
  
  constructor(options: SearchOptions) {
    this.options = options;
  }

  initIndex(_indexName: string): Index {
    throw new Error("initIndex not supported by NativeSearchClient");
  }

  search<T=unknown>(
    queries: NativeSearchClientSearchQuery[],
    cb: (err: Error|null, res: MultiResponse<T>|null) => void,
  ): void;
  search<T=unknown>(queries: NativeSearchClientSearchQuery[]): Promise<MultiResponse<T>>;
  search<T=unknown>(
    queries: NativeSearchClientSearchQuery[],
    cb?: (err: Error|null, res: MultiResponse<T>|null) => void,
  ): Promise<MultiResponse<T>>|void {
    const body = stringify({
      options: this.options,
      queries
    });
    const cached = this.cache.get(body);
    if (cached) {
      return Promise.resolve(cached) as Promise<MultiResponse<T>>;
    }
    const promise = new Promise<MultiResponse<T>>((resolve, reject) => {
      fetch("/api/search", {
        method: "POST",
        headers: {
          ...this.headers,
          "Content-Type": "application/json",
        },
        body,
      }).then((response) => {
        response.json().then((results) => {
          resolve({results});
        }).catch(reject);
      }).catch(reject);
    });
    this.cache.set(body, promise);
    if (cb) {
      promise.then((result) => cb(null, result)).catch((err) => cb(err, null));
    } else {
      return promise;
    }
  }

  searchForFacetValues(
    _queries: [{ indexName: string; params: SearchForFacetValues.Parameters }]
  ): Promise<SearchForFacetValues.Response[]> {
    throw new Error("searchForFacetValues not supported by NativeSearchClient");
  }

  clearCache(): void {
    this.cache.reset();
  }

  setExtraHeader(name: string, value: string): void {
    this.headers[name] = value;
  }

  getExtraHeader(name: string): string {
    return this.headers[name];
  }

  unsetExtraHeader(name: string): void {
    delete this.headers[name];
  }

  addAlgoliaAgent(_agent: string): void {}
}

export default NativeSearchClient;
