import type { Index } from "algoliasearch/lite";
import type { MultiResponse, QueryParameters, SearchForFacetValues } from "algoliasearch";

export type SearchQuery = {
  indexName: string;
  query: string;
  params: QueryParameters;
}

class PostgresSearchClient {
  private headers: Record<string, string> = {};

  initIndex(_indexName: string): Index {
    throw new Error("initIndex not supported by PostgresSearchClient");
  }

  search<T=any>(
    queries: SearchQuery[],
    cb: (err: Error|null, res: MultiResponse<T>|null) => void,
  ): void;
  search<T=any>(queries: SearchQuery[]): Promise<MultiResponse<T>>;
  search<T=any>(
    queries: SearchQuery[],
    cb?: (err: Error|null, res: MultiResponse<T>|null) => void,
  ): Promise<MultiResponse<T>>|void {
    const promise = new Promise<MultiResponse<T>>((resolve, reject) => {
      fetch("/api/search", {
        method: "POST",
        headers: {
          ...this.headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(queries),
      }).then((response) => {
        response.json().then((results) => {
          resolve({results});
        }).catch(reject);
      }).catch(reject);
    });
    if (cb) {
      promise.then((result) => cb(null, result)).catch((err) => cb(err, null));
    } else {
      return promise;
    }
  }

  searchForFacetValues(
    _queries: [{ indexName: string; params: SearchForFacetValues.Parameters }]
  ): Promise<SearchForFacetValues.Response[]> {
    throw new Error("searchForFacetValues not supported by PostgresSearchClient");
  }

  clearCache(): void {
    // TODO
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

export default PostgresSearchClient;
