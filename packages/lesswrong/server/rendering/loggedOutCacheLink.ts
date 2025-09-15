import { type DocumentNode, ApolloLink, Operation, Observable, FetchResult } from "@apollo/client";
import stringify from "json-stringify-deterministic";
import { unstable_cache } from "next/cache";
import { type GraphQLSchema, print, execute } from "graphql";
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";
import { SwrCache } from "@/lib/utils/swrCache";

/*const getCachedQueryResult = unstable_cache(async (cacheKey: string, queryFunction: () => Promise<FetchResult>) => {
  return await queryFunction();
}, undefined, { revalidate: 120 });

/**
 * Caches the provided gql operation's execution.
 * We need to do this wonky two-step inversion from to/from an Observable because we need the results in the cache,
 * and we can't just cache an Observable because it's not serializable.  So it needs to be a promise here,
 * and an Observable in the link.
 */
/*async function executeWithCache(operation: Operation: ApolloLink.ForwardFunction): Promise<ApolloLink.Result> {
  const { query, variables } = operation;
  const queryString = print(query);
  const cacheKey = stringify({ queryString, variableValues: variables });

  return getCachedQueryResult(cacheKey, () => {
    return new Promise(async (resolve) => {
      const { runQuery } = await import("@/server/vulcan-lib/query");
      runQuery(query);
      forward(operation).subscribe((res) => resolve(res));
    });
  });
}*/

const loggedOutQueryCache: Record<string, SwrCache<FetchResult, []>> = {};

async function executeWithCache({ schema, document, rootValue, variableValues, operationName }: {
  schema: GraphQLSchema,
  document: DocumentNode,
  rootValue: any,
  variableValues: any,
  operationName: string,
}): Promise<FetchResult> {
  const queryString = print(document);
  const cacheKey = stringify({ queryString, variableValues });
  
  if (!loggedOutQueryCache[cacheKey]) {
    loggedOutQueryCache[cacheKey] = new SwrCache({
      generate: async () => {
        const context = createAnonymousContext();
        return await execute({
          schema, document, rootValue, contextValue: context, variableValues, operationName
        });
      },
      expiryMs: 120000,
    });
  }
  
  return loggedOutQueryCache[cacheKey].get();
}



/**
 * Apollo link, for use during SSR, which checks whether queries have
 * {loggedOutCache: true} in their context and, if so, executes them with
 * executeWithCache instead of the normal graphql execution path. This is
 * currently used only for the LW front page spotlight.
 */
export class LoggedOutCacheLink extends ApolloLink {
  schema: GraphQLSchema

  constructor(schema: GraphQLSchema) {
    super();
    this.schema = schema;
  }

  public request(operation: Operation, forward: ApolloLink.ForwardFunction): Observable<ApolloLink.Result> {
    const wantsLoggedOutCache = operation.getContext()?.loggedOutCache === true;
    if (!wantsLoggedOutCache) {
      return forward(operation);
    }

    return new Observable<ApolloLink.Result>((observer) => {
      new Promise<ApolloLink.Result>((resolve) => {
        resolve(executeWithCache({
          schema: this.schema,
          document: operation.query,
          rootValue: undefined,
          variableValues: operation.variables,
          operationName: operation.operationName ?? "",
        }));
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

