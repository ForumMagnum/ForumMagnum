/*

Run a GraphQL request from the server with the proper context

*/
import { graphql, GraphQLError } from 'graphql';
import { localeSetting } from '../../lib/publicSettings';
import { getExecutableSchema } from './apollo-server/initGraphQL';
import { getCollectionsByName, generateDataLoaders } from './apollo-server/context';
import { getAllRepos } from '../repos';

function writeGraphQLErrorToStderr(errors: readonly GraphQLError[])
{
  // eslint-disable-next-line no-console
  console.error(`runQuery error: ${errors[0].message}`);
  // eslint-disable-next-line no-console
  console.error(errors);
}

let onGraphQLError = writeGraphQLErrorToStderr;
export function setOnGraphQLError(fn: ((errors: readonly GraphQLError[])=>void)|null)
{
  if (fn)
    onGraphQLError = fn;
  else
    onGraphQLError = writeGraphQLErrorToStderr;
}

// note: if no context is passed, default to running requests with full admin privileges
export const runQuery = async (query: string, variables: any = {}, context?: Partial<ResolverContext>) => {
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
    clientId: null,
    visitorActivity: null,
    currentUser: null,
    headers: null,
    locale: localeSetting.get(),
    isGreaterWrong: false,
    repos: getAllRepos(),
    ...getCollectionsByName(),
    ...generateDataLoaders(),
    ...options,
  };
  
  return queryContext;
}
export const createAdminContext = (options?: Partial<ResolverContext>): ResolverContext => {
  return {
    ...createAnonymousContext(),
    // HACK: Instead of a full user object, this is just a mostly-empty object with isAdmin set to true
    currentUser: {isAdmin: true} as DbUser,
    ...options,
  };
}
