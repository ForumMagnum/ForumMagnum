/*

Run a GraphQL request from the server with the proper context

*/
import { ExecutionResult, graphql, GraphQLError, print } from 'graphql';
import { createAnonymousContext } from './createContexts';
import { ResultOf, TypedDocumentNode } from '@graphql-typed-document-node/core';
import { getExecutableSchema } from './apollo-server/initGraphQL';
import { EmailContextType } from '../emailComponents/emailContext';
import type { OperationVariables } from '@apollo/client';

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
export const runQuery = async <const TDocumentNode extends TypedDocumentNode<any, any>>(query: string | TDocumentNode, variables: any = {}, context?: Partial<ResolverContext>) => {
  const executableSchema = getExecutableSchema();
  const queryContext = createAnonymousContext(context);

  const stringQuery = typeof query === 'string'
    ? query
    : print(query)

  // see http://graphql.org/graphql-js/graphql/#graphql
  const result = await graphql({
    schema: executableSchema,
    source: stringQuery,
    rootValue: {},
    contextValue: queryContext,
    variableValues: variables,
  }) as ExecutionResult<ResultOf<TDocumentNode>>;

  if (result.errors) {
    onGraphQLError(result.errors);
    throw new Error(result.errors[0].message);
  }

  return result;
};

export const useEmailQuery = <
  TData extends Record<string, any>,
  TVariables extends OperationVariables
>(
  query: TypedDocumentNode<TData, TVariables>,
  options: {
    variables?: TVariables
    emailContext: EmailContextType,
    skip?: boolean
  },
) => {
  if (options.skip) {
    return { data: null, errors: null };
  }

  return runQuery(query, options.variables ?? {}, options.emailContext.resolverContext);
}
