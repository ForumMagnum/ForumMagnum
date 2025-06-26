/*

Run a GraphQL request from the server with the proper context

*/
import { PrimitiveGraphQLType } from '@/lib/crud/types';
import { getMultiResolverName, getSingleResolverName } from '@/lib/crud/utils';
import { getGraphQLMultiQueryFromOptions } from '@/lib/crud/withMulti';
import { getGraphQLSingleQueryFromOptions } from '@/lib/crud/withSingle';
import { collectionNameToTypeName } from '@/lib/generated/collectionTypeNames';
import { DocumentNode, ExecutionResult, graphql, GraphQLError, print } from 'graphql';
import { makeExecutableSchema } from 'graphql-tools';
import { typeDefs, resolvers } from './apollo-server/initGraphQL';
import { createAnonymousContext } from './createContexts';

function writeGraphQLErrorToStderr(errors: readonly GraphQLError[])
{
  // eslint-disable-next-line no-console
  console.error(`runQuery error: ${errors[0].message}, trace: ${errors[0].stack}`);
  // eslint-disable-next-line no-console
  console.error(JSON.stringify(errors, null, 2));
}

let onGraphQLError = writeGraphQLErrorToStderr;
export function setOnGraphQLError(fn: ((errors: readonly GraphQLError[]) => void)|null)
{
  if (fn)
    onGraphQLError = fn;
  else
    onGraphQLError = writeGraphQLErrorToStderr;
}

// note: if no context is passed, default to running requests with full admin privileges
export const runQuery = async <T = Record<string, any>>(query: string | DocumentNode, variables: any = {}, context?: Partial<ResolverContext>) => {
  const executableSchema = makeExecutableSchema({ typeDefs, resolvers });
  const queryContext = createAnonymousContext(context);

  const stringQuery = typeof query === 'string'
    ? query
    : print(query)

  // see http://graphql.org/graphql-js/graphql/#graphql
  const result = await graphql(executableSchema, stringQuery, {}, queryContext, variables) as ExecutionResult<T>;

  if (result.errors) {
    onGraphQLError(result.errors);
    throw new Error(result.errors[0].message);
  }

  return result;
};

export const runFragmentSingleQuery = async <
  FragmentTypeName extends keyof FragmentTypes,
  CollectionName extends CollectionNameString,
>({ collectionName, fragmentName, documentId, extraVariables, extraVariablesValues, context }: {
  collectionName: CollectionName,
  fragmentName: FragmentTypeName,
  documentId: string,
  extraVariables?: Record<string, PrimitiveGraphQLType>,
  extraVariablesValues?: Record<string, unknown>,
  context?: ResolverContext,
}) => {
  const typeName = collectionNameToTypeName[collectionName];
  const resolverName = getSingleResolverName(typeName);

  const query = getGraphQLSingleQueryFromOptions({ collectionName, fragmentName, fragment: undefined, resolverName, extraVariables });

  const variables = {
    input: { selector: { documentId }, resolverArgs: extraVariablesValues },
    ...extraVariablesValues
  };

  const queryResult = await runQuery<Record<string, { result?: FragmentTypes[FragmentTypeName] }>>(query, variables, context);

  return queryResult.data?.[resolverName]?.result;
};

export const runFragmentMultiQuery = async <
  FragmentTypeName extends keyof FragmentTypes,
  CollectionName extends CollectionNameString,
>({ collectionName, fragmentName, terms, extraVariables, extraVariablesValues, context }: {
  collectionName: CollectionName,
  fragmentName: FragmentTypeName,
  terms: ViewTermsByCollectionName[CollectionName],
  extraVariables?: Record<string, PrimitiveGraphQLType>,
  extraVariablesValues?: Record<string, unknown>,
  context?: ResolverContext,
}) => {
  const typeName = collectionNameToTypeName[collectionName];
  const resolverName = getMultiResolverName(typeName);

  const query = getGraphQLMultiQueryFromOptions({ collectionName, typeName, fragmentName, fragment: undefined, resolverName, extraVariables });

  const variables = {
    input: { terms, resolverArgs: extraVariablesValues },
    ...extraVariablesValues
  };

  const result = await runQuery<Record<string, { results: Array<FragmentTypes[FragmentTypeName]> }>>(query, variables, context);

  return result.data?.[resolverName]?.results ?? [];
};
