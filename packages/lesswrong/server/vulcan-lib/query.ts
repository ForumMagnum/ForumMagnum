/*

Run a GraphQL request from the server with the proper context

*/
import DataLoader from 'dataloader';
import { graphql } from 'graphql';
import merge from 'lodash/merge';
import { localeSetting } from '../../lib/publicSettings';
import { Collections } from '../../lib/vulcan-lib/collections';
import { GraphQLSchema } from '../../lib/vulcan-lib/graphql';
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
export const runGraphQL = async (query: any, variables: any = {}, context?: any) => {
  const defaultContext = {
    currentUser: { isAdmin: true },
    locale: localeSetting.get(),
  };
  const queryContext = merge(defaultContext, context);
  const executableSchema = GraphQLSchema.getExecutableSchema();

  // within the scope of this specific request,
  // decorate each collection with a new Dataloader object and add it to context
  Collections.forEach((collection: any) => {
    collection.loader = new DataLoader((ids: Array<string>) => findByIds(collection, ids), {
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
