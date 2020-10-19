/*

Run a GraphQL request from the server with the proper context

*/
import DataLoader from 'dataloader';
import { graphql } from 'graphql';
import merge from 'lodash/merge';
import { localeSetting } from '../../lib/publicSettings';
import { Collections } from '../../lib/vulcan-lib/collections';
import { getExecutableSchema } from './apollo-server/initGraphQL';
import { getCollectionsByName, generateDataLoaders } from './apollo-server/context';
import findByIds from './findbyids';

function writeGraphQLErrorToStderr(errors)
{
  // eslint-disable-next-line no-console
  console.error(`runGraphQL error: ${errors[0].message}`);
  // eslint-disable-next-line no-console
  console.error(errors);
}

let onGraphQLError = writeGraphQLErrorToStderr;
export function setOnGraphQLError(fn)
{
  if (fn)
    onGraphQLError = fn;
  else
    onGraphQLError = writeGraphQLErrorToStderr;
}

// note: if no context is passed, default to running requests with full admin privileges
export const runGraphQL = async (query: string, variables: any = {}, context?: Partial<ResolverContext>) => {
  const executableSchema = getExecutableSchema();
  const queryContext = createAdminContext(context);

  // see http://graphql.org/graphql-js/graphql/#graphql
  const result = await graphql(executableSchema, query, {}, queryContext, variables);

  if (result.errors) {
    onGraphQLError(result.errors);
    throw new Error(result.errors[0].message);
  }

  return result;
};

export const createAnonymousContext = (options?: Partial<ResolverContext>): ResolverContext => {
  const queryContext = {
    userId: null,
    currentUser: null,
    headers: null,
    locale: localeSetting.get(),
    ...getCollectionsByName(),
    ...generateDataLoaders(),
    ...options,
  };
  
  return queryContext;
}
export const createAdminContext = (options?: Partial<ResolverContext>): ResolverContext => {
  return {
    ...createAnonymousContext(options),
    // HACK: Instead of a full user object, this is just a mostly-empty object with isAdmin set to true
    currentUser: {isAdmin: true} as DbUser,
  };
}

export const runQuery = runGraphQL; //backwards compatibility
