import { buildClientSchema, GraphQLSchema, SourceLocation } from "graphql";
import { SchemaLink } from '@apollo/client/link/schema';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { onError } from '@apollo/client/link/error';
import { isServer } from '../executionEnvironment';
import { DatabasePublicSetting } from "../publicSettings";
import { ApolloLink, Operation, selectURI } from "@apollo/client/core";

const rawClientSchema = require("@/lib/generated/client-schema.min.json");
const schema = buildClientSchema(rawClientSchema);

const graphqlBatchMaxSetting = new DatabasePublicSetting('batchHttpLink.batchMax', 50)

export const crosspostUserAgent = "ForumMagnum/2.1";

/**
 * "Links" are Apollo's way of defining the source to read our data from, and they need to
 * be set up differently depending on whether we're rendering on the server or on the client,
 * and whether we're rendering local data or foreign crosspost data. Multiple links can be
 * chained together, for instance, for error handling.
 *
 * https://www.apollographql.com/docs/react/api/link/introduction/
 */

/**
 * Schema link is used for SSR
 */
export const createSchemaLink = (schema: GraphQLSchema, context: ResolverContext) =>
  // We are doing `context: () => ({...context})` rather than just context to fix a bug in datadog, see: https://github.com/DataDog/dd-trace-js/issues/709
  new SchemaLink({ schema, context: () => ({...context}) });

/**
 * Http link is used for client side rendering
 */
export const createHttpLink = (baseUrl = '/') => {
  const uri = baseUrl + 'graphql';

  const batchKey = (operation: Operation) => {
    // The default part is copied from https://github.com/apollographql/apollo-client/blob/main/src/link/batch-http/batchHttpLink.ts#L192-L206
    const context = operation.getContext();

    const contextConfig = {
      http: context.http,
      options: context.fetchOptions,
      credentials: context.credentials,
      headers: context.headers,
    };

    const defaultBatchKey = selectURI(operation, uri) + JSON.stringify(contextConfig);

    // If the operation has a batchKey variable, add that to the batch key.
    // This is to manually separate out very slow queries
    const explicitBatchKey = context.batchKey;

    return explicitBatchKey && typeof explicitBatchKey === "string" ? defaultBatchKey : defaultBatchKey + explicitBatchKey;
  };

  const fetch: typeof globalThis.fetch = isServer
    ? (url, options) => globalThis.fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        // user agent because LW bans bot agents
        'User-Agent': crosspostUserAgent,
      }
    })
    : globalThis.fetch;
  return new BatchHttpLink({
    uri,
    credentials: baseUrl === '/' ? 'same-origin' : 'omit',
    batchMax: graphqlBatchMaxSetting.get(),
    fetch,
    batchKey,
  });
}

export const headerLink = new ApolloLink((operation, forward) => {
  if (!isServer) {
    const url = new URL(window.location.href)
    const path = url.pathname + url.search

    const headers = {
      'request-origin-path': path,
      'x-apollo-operation-name': operation.operationName,
    };

    operation.setContext({
      headers,
    });
  }
  return forward(operation);
});

const locationsToStr = (locations: readonly SourceLocation[] = []) =>
  locations.map(({column, line}) => `line ${line}, col ${column}`).join(';');

/**
 * This is an extra utility link that is currently used for client side error handling
 */
export const createErrorLink = () =>
  onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors)
      graphQLErrors.map(({ message, locations, path }) => {
        const locationStr = locations && locationsToStr([...locations]);
        // eslint-disable-next-line no-console
        console.error(`[GraphQL error]: Message: ${message}, Location: ${locationStr}, Path: ${path}`);
      });
    if (networkError) {
      // eslint-disable-next-line no-console
      console.error(`[Network error]: ${networkError}`);
    }
  });
