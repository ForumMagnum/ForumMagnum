import { ApolloClient, ApolloLink, InMemoryCache, Observable, Operation, FetchResult } from '@apollo/client';
import { createSchemaLink, createHttpLink, createErrorLink } from '../../../lib/apollo/links';
import { fmCrosspostBaseUrlSetting } from "../../../lib/instanceSettings";
import { type DocumentNode, type GraphQLSchema, execute, print } from 'graphql';
import stringify from 'json-stringify-deterministic';
import { SwrCache } from '@/lib/utils/swrCache';
import { createAnonymousContext } from '../createContexts';

// This client is used to prefetch data server side (necessary for SSR)
// It is recreated on every request.
export const createClient = async (context: ResolverContext | null, foreign = false) => {
  const cache = new InMemoryCache();

  const links: ApolloLink[] = [];

  if (foreign) {
    links.push(createErrorLink());
    links.push(createHttpLink(fmCrosspostBaseUrlSetting.get() ?? "/", null));
  } else if (context) {
    links.push(createErrorLink());

    const { getExecutableSchema } = await import('../apollo-server/initGraphQL');

    const schema = getExecutableSchema();
    links.push(new LoggedOutCacheSchemaLink(schema));

    // schemaLink will fetch data directly based on the executable schema
    // context here is the resolver context
    links.push(createSchemaLink(schema, context));
  } else {
    // eslint-disable-next-line no-console
    console.error("createClient called with no context");
  }

  const client = new ApolloClient({
    ssrMode: true,
    link: ApolloLink.from(links),
    cache,
    assumeImmutableResults: true,
  });
  await client.clearStore();
  return client;
};


/**
 * Apollo link, for use during SSR, which checks whether queries have
 * {loggedOutCache: true} in their context and, if so, executes them with
 * executeWithCache instead of the normal graphql execution path. This is
 * currently used only for the LW front page spotlight.
 */
class LoggedOutCacheSchemaLink extends ApolloLink {
  public schema: GraphQLSchema

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
            observer.next(data);
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
