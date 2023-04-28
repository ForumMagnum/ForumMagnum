import type { Client, Index } from "algoliasearch/lite";
import type { MultiResponse, QueryParameters, SearchForFacetValues } from "algoliasearch";
import LRU from "lru-cache";

export type SearchQuery = {
  indexName: string;
  query: string;
  params: QueryParameters;
}

class NativeSearchClient implements Client {
  private headers: Record<string, string> = {};
  private cache = new LRU<string, Promise<MultiResponse<unknown>>>();

  initIndex(_indexName: string): Index {
    throw new Error("initIndex not supported by NativeSearchClient");
  }

  search<T=unknown>(
    queries: SearchQuery[],
    cb: (err: Error|null, res: MultiResponse<T>|null) => void,
  ): void;
  search<T=unknown>(queries: SearchQuery[]): Promise<MultiResponse<T>>;
  search<T=unknown>(
    queries: SearchQuery[],
    cb?: (err: Error|null, res: MultiResponse<T>|null) => void,
  ): Promise<MultiResponse<T>>|void {
    const body = JSON.stringify(queries);
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
