import { gql, useQuery as apolloUseQuery } from '@apollo/client';
import type { QueryResult as ApolloQueryResult, QueryHookOptions } from '@apollo/client';
import type { DocumentNode as GqlDocumentNode } from 'graphql';
import { getSubfragmentsFromGraphQL, removeCommentsFromGraphQL, fragmentTextForQuery } from '../vulcan-lib/fragments';
import { allQueries } from '../queries';

const parseQuery = (queryName: QueryName) => {
  const querySource = allQueries[queryName];
  const queryText = removeCommentsFromGraphQL(querySource);
  const subFragments = getSubfragmentsFromGraphQL(queryText);
  const queryWithFragments = queryText+"\n"+fragmentTextForQuery(subFragments as FragmentName[]);
  return gql(queryWithFragments);
}

const parsedQueries: Partial<Record<QueryName,GqlDocumentNode>> = {};

interface QueryHookOptionsWithArgumentTypes<N extends QueryName> extends QueryHookOptions {
  variables?: QueryArgumentTypes[N]
}

export function useQuery<N extends QueryName>(queryName: N, options: QueryHookOptionsWithArgumentTypes<N>): ApolloQueryResult<QueryResultTypes[N],any> {
  if (!parsedQueries[queryName]) {
    parsedQueries[queryName] = parseQuery(queryName);
  }
  const parsedQuery = parsedQueries[queryName]!;
  return apolloUseQuery(parsedQuery, options);
}
