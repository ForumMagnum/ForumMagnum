import type { GraphQLSchema, SourceLocation } from "graphql";
import { SchemaLink } from '@apollo/client/link/schema';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { onError } from '@apollo/client/link/error';
import { isServer } from '../executionEnvironment';

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
  new SchemaLink({ schema, context });

/**
 * Http link is used for client side rendering
 */
export const createHttpLink = (baseUrl = '/') =>
  new BatchHttpLink({
    uri: baseUrl + 'graphql',
    credentials: baseUrl === '/' ? 'same-origin' : 'omit',
    batchMax: 50,
    // TODO: This line can be removed once we upgrade to node v18
    fetch: isServer ? require("cross-fetch") : window.fetch,
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
