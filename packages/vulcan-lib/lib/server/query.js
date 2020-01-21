/*

Run a GraphQL request from the server with the proper context

*/
import { graphql } from 'graphql';
import { Collections } from '../modules/collections.js';
import DataLoader from 'dataloader';
import findByIds from '../modules/findbyids.js';
import { getSetting } from '../modules/settings';
import merge from 'lodash/merge';
import { GraphQLSchema } from '../modules/graphql';

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
export const runGraphQL = async (query, variables = {}, context) => {
  const defaultContext = {
    currentUser: { isAdmin: true },
    locale: getSetting('locale'),
  };
  const queryContext = merge(defaultContext, context);
  const executableSchema = GraphQLSchema.getExecutableSchema();

  // within the scope of this specific request,
  // decorate each collection with a new Dataloader object and add it to context
  Collections.forEach(collection => {
    collection.loader = new DataLoader(ids => findByIds(collection, ids, queryContext), {
      cache: true,
    });
    queryContext[collection.options.collectionName] = collection;
  });

  // see http://graphql.org/graphql-js/graphql/#graphql
  const result = await graphql(executableSchema, query, {}, queryContext, variables);

  if (result.errors) {
      onGraphQLError(result.errors);
    throw new Error(result.errors[0].message);
  }

  return result;
};

export const runQuery = runGraphQL; //backwards compatibility
