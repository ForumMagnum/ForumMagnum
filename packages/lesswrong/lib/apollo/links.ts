import type { GraphQLSchema, SourceLocation } from "graphql";
import { SchemaLink } from '@apollo/client/link/schema';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { onError } from '@apollo/client/link/error';

export const createSchemaLink = (schema: GraphQLSchema, context: ResolverContext) =>
  new SchemaLink({ schema, context });

export const createHttpLink = (baseUrl = '/') =>
  new BatchHttpLink({
    uri: baseUrl + 'graphql',
    credentials: baseUrl === '/' ? 'same-origin' : 'omit',
    batchMax: 50,
  });

const locationsToStr = (locations: readonly SourceLocation[] = []) =>
  locations.map(({column, line}) => `line ${line}, col ${column}`).join(';');

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
