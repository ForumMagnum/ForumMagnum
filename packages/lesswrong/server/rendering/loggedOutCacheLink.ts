import { type DocumentNode, ApolloLink, Operation, Observable, FetchResult } from "@apollo/client";
import stringify from "json-stringify-deterministic";
import { type GraphQLSchema, print, execute } from "graphql";
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";
import { SwrCache } from "@/lib/utils/swrCache";
import type { ForumTypeString } from "@/lib/instanceSettings";

const loggedOutQueryCache: Record<string, SwrCache<FetchResult, []>> = {};

async function executeWithCache({ schema, document, rootValue, variableValues, operationName, forumType }: {
  schema: GraphQLSchema,
  document: DocumentNode,
  rootValue: any,
  variableValues: any,
  operationName: string,
  forumType: ForumTypeString,
}): Promise<FetchResult> {
  const queryString = print(document);
  const cacheKey = stringify({ queryString, variableValues, forumType });
  
  if (!loggedOutQueryCache[cacheKey]) {
    loggedOutQueryCache[cacheKey] = new SwrCache({
      generate: async () => {
        const context = createAnonymousContext({ forumType });
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
  forumType: ForumTypeString

  constructor(schema: GraphQLSchema, forumType: ForumTypeString) {
    super();
    this.schema = schema;
    this.forumType = forumType;
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
          forumType: this.forumType,
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
