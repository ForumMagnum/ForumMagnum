import { ApolloLink, Operation, NextLink, Observable, FetchResult } from "@apollo/client";
import stringify from "json-stringify-deterministic";
import { unstable_cache } from "next/cache";
import { print } from "graphql";

const getCachedQueryResult = unstable_cache(async (cacheKey: string, queryFunction: () => Promise<FetchResult>) => {
  return await queryFunction();
}, undefined, { revalidate: 120 });

/**
 * Caches the provided gql operation's execution.
 * We need to do this wonky two-step inversion from to/from an Observable because we need the results in the cache,
 * and we can't just cache an Observable because it's not serializable.  So it needs to be a promise here,
 * and an Observable in the link.
 */
async function executeWithCache(operation: Operation, forward?: NextLink): Promise<FetchResult | null> {
  const { query, variables } = operation;
  const queryString = print(query);
  const cacheKey = stringify({ queryString, variableValues: variables });

  return getCachedQueryResult(cacheKey, () => {
    return new Promise((resolve) => {
      forward?.(operation)?.subscribe((res) => resolve(res));
    });
  });
}


/**
 * Apollo link, for use during SSR, which checks whether queries have
 * {loggedOutCache: true} in their context and, if so, executes them with
 * executeWithCache instead of the normal graphql execution path. This is
 * currently used only for the LW front page spotlight.
 */
export class LoggedOutCacheLink extends ApolloLink {
  constructor() {
    super();
  }

  public request(operation: Operation, forward?: NextLink): Observable<FetchResult> | null {
    const wantsLoggedOutCache = operation.getContext()?.loggedOutCache === true;
    if (!wantsLoggedOutCache) {
      return forward?.(operation) ?? null;
    }

    return new Observable<FetchResult>((observer) => {
      new Promise<FetchResult | null>((resolve) => {
        resolve(executeWithCache(operation, forward));
      })
        .then((data) => {
          if (!observer.closed) {
            observer.next(data ?? { data: null });
            observer.complete();
          }
        })
        .catch((error) => {
          if (!observer.closed) {
            observer.error(error);
          }
        });
    });
  }
}
