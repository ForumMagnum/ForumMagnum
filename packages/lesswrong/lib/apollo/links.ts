import type { GraphQLSchema, SourceLocation } from "graphql";
import { SchemaLink } from '@apollo/client/link/schema';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { onError } from '@apollo/client/link/error';
import { isServer } from '../executionEnvironment';

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
  new SchemaLink({ schema, context: () => context });

/**
 * Http link is used for client side rendering
 */
export const createHttpLink = (baseUrl = '/') => {
  // Type of window.fetch may differ slightly from type of the fetch used on server
  let fetch: typeof window.fetch;
  if (isServer) {
    // We won't need to import fetch in node 18
    const nodeFetch = require('node-fetch');
    fetch = (url, options) => nodeFetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        // user agent because LW bans bot agents
        'User-Agent': crosspostUserAgent,
      }
    });
  } else {
    fetch = window.fetch;
  }
  return new BatchHttpLink({
    uri: baseUrl + 'graphql',
    credentials: baseUrl === '/' ? 'same-origin' : 'omit',
    batchMax: 50,
    fetch,
  });
}

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
