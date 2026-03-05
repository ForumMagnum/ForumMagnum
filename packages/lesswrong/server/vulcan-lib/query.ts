/*

Run a GraphQL request from the server with the proper context

*/
import { ExecutionResult, graphql, GraphQLError, print } from 'graphql';
import { createAnonymousContext } from './createContexts';
import { ResultOf, TypedDocumentNode } from '@graphql-typed-document-node/core';
import { EmailContextType } from '../emailComponents/emailContext';
import type { OperationVariables } from '@apollo/client';
import { isSSRQueryRuntimeContext, type SSRQueryRuntimeContext } from '@/lib/crud/ssrQueryRuntimeContext';

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

async function executeLocalQuery<TData extends Record<string, any>, TVariables extends OperationVariables>(
  stringQuery: string,
  variables: TVariables,
  context?: Partial<ResolverContext>,
): Promise<ExecutionResult<ResultOf<TypedDocumentNode<TData, TVariables>>>> {
  const { getExecutableSchema } = await import('./apollo-server/initGraphQL');

  const executableSchema = getExecutableSchema();
  const queryContext = createAnonymousContext(context);

  // see http://graphql.org/graphql-js/graphql/#graphql
  const result = await graphql({
    schema: executableSchema,
    source: stringQuery,
    rootValue: {},
    contextValue: queryContext,
    variableValues: variables,
  }) as ExecutionResult<ResultOf<TypedDocumentNode<TData, TVariables>>>;
  return result;
}

async function executeWorkerQuery<TData extends Record<string, any>, TVariables extends OperationVariables>(
  querySource: string,
  variables: TVariables,
  runtimeContext: SSRQueryRuntimeContext,
): Promise<ExecutionResult<ResultOf<TypedDocumentNode<TData, TVariables>>>> {
  const { executeSSRWorkerQuery, getFallbackResolverContextForSSR, recordSSRWorkerFallback } = await import('@/server/rendering/ssrApolloClient');
  try {
    return await executeSSRWorkerQuery({
      requestId: runtimeContext.requestId,
      querySource,
      variables: variables as Record<string, unknown>,
    }) as ExecutionResult<ResultOf<TypedDocumentNode<TData, TVariables>>>;
  } catch (error) {
    await recordSSRWorkerFallback();
    const fallbackResolverContext = runtimeContext.resolverContext
      ?? await getFallbackResolverContextForSSR(runtimeContext.requestId);
    return await executeLocalQuery<TData, TVariables>(querySource, variables, fallbackResolverContext);
  }
}

// note: if no context is passed, default to running requests with full admin privileges
export const runQuery = async <TData extends Record<string, any>, TVariables extends OperationVariables>(
  query: string | TypedDocumentNode<TData, TVariables>,
  variables: TVariables = {} as TVariables,
  context?: Partial<ResolverContext> | SSRQueryRuntimeContext,
) => {
  const stringQuery = typeof query === 'string'
    ? query
    : print(query);

  const result = isSSRQueryRuntimeContext(context)
    ? await executeWorkerQuery<TData, TVariables>(stringQuery, variables, context)
    : await executeLocalQuery<TData, TVariables>(stringQuery, variables, context);

  if (result.errors) {
    onGraphQLError(result.errors);
    throw new Error(result.errors?.[0]?.message);
  }

  return result;
};

export const emailUseQuery = <
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
