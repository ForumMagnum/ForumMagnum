import { ApolloClient, NormalizedCacheObject, ApolloError, gql, useQuery, WatchQueryFetchPolicy } from '@apollo/client';
import { extractFragmentInfo } from '../vulcan-lib/handleOptions';
import { collectionNameToTypeName } from '../generated/collectionTypeNames';
import { apolloSSRFlag } from '../helpers';
import type { PrimitiveGraphQLType } from './types';
import { getSingleResolverName } from './utils';
import { print } from 'graphql';

/**
 * Given terms/etc for a useSingle query, generate corresponding GraphQL. Exported
 * for use in crossposting-related integrations. You probably don't want to use
 * this directly; in most cases you should use the useSingle hook instead.
 */
export function getGraphQLSingleQueryFromOptions({ collectionName, fragment, fragmentName, resolverName, extraVariables }: {
  collectionName: CollectionNameString,
  fragment: any,
  fragmentName: FragmentName|undefined,
  resolverName: string,
  extraVariables?: Record<string, PrimitiveGraphQLType>,
}) {
  ({ fragmentName, fragment } = extractFragmentInfo({ fragment, fragmentName }, collectionName));
  const typeName = collectionNameToTypeName[collectionName];

  // LESSWRONG MODIFICATION: Allow the passing of extraVariables so that you can have field-specific queries
  let extraVariablesString = ''
  if (extraVariables) {
    extraVariablesString = Object.keys(extraVariables).map(k => `$${k}: ${extraVariables[k]}`).join(', ')
  }

  const queryText = `
    query single${typeName}Query($input: Single${typeName}Input, ${extraVariablesString || ''}) {
      ${resolverName}(input: $input) {
        result {
          ...${fragmentName}
        }
        __typename
      }
    }
    ${print(fragment)}
    `

  const query = gql`${queryText}`;
  
  return query
}

type TSuccessReturn<FragmentTypeName extends keyof FragmentTypes> = {loading: false, error: undefined, document: FragmentTypes[FragmentTypeName]};
type TErrorReturn = {loading: false, error: ApolloError, document: undefined};
type TLoadingReturn = {loading: true, error: undefined, document: undefined};

type TReturn<FragmentTypeName extends keyof FragmentTypes> = (TSuccessReturn<FragmentTypeName> | TErrorReturn | TLoadingReturn) & {
  refetch: any,
  networkStatus?: number,
  data?: {
    refetch: any,
  }
}

// You can pass either `documentId` or `slug`, but not both. The must pass one;
// you pass undefined, in which case the query is skipped.
export type SelectorInput = { documentId: string | undefined };

export type UseSingleProps<FragmentTypeName extends keyof FragmentTypes> = (
  SelectorInput & {
    collectionName: CollectionNameString,
    fragmentName?: FragmentTypeName,
    fragment?: any,
    extraVariables?: Record<string,any>,
    extraVariablesValues?: any,
    fetchPolicy?: WatchQueryFetchPolicy,
    nextFetchPolicy?: WatchQueryFetchPolicy,
    notifyOnNetworkStatusChange?: boolean,
    allowNull?: boolean,
    skip?: boolean,
    ssr?: boolean,
    /**
     * Optional Apollo client instance to use for this request. If not provided,
     * uses the default client provided by React context. This should only be
     * overriden for crossposting or similar foreign-DB operations.
     */
    apolloClient?: ApolloClient<NormalizedCacheObject>,
  }
);

/**
 * React hook that queries a collection, returning a single document with the
 * given ID, along with metadata about loading status and errors.
 *
 * In most cases, you will provide a documentId, collectionName, and
 * fragmentName. If any resolvers in the fragment have arguments attached, you
 * will also need to pass `extraVariables`, which contains the GraphQL types
 * of those arguments, and extraVariablesValues, which contains their values.
 */
// export function useSingle<FragmentTypeName extends keyof FragmentTypes>({
//   documentId,
//   collectionName,
//   fragmentName, fragment,
//   extraVariables,
//   extraVariablesValues,
//   fetchPolicy,
//   nextFetchPolicy,
//   notifyOnNetworkStatusChange,
//   allowNull,
//   skip=false,
//   ssr=true,
//   apolloClient,
// }: UseSingleProps<FragmentTypeName>): TReturn<FragmentTypeName> {
//   const typeName = collectionNameToTypeName[collectionName];
//   const resolverName = getSingleResolverName(typeName)
//   const query = getGraphQLSingleQueryFromOptions({ extraVariables, collectionName, fragment, fragmentName, resolverName })
//   const skipQuery = skip || !documentId;
//   // TODO: Properly type this generic query
//   const { data, error, loading, ...rest } = useQuery(query, {
//     variables: {
//       input: {
//         selector: { documentId },
//         resolverArgs: extraVariablesValues,
//         ...(allowNull && {allowNull: true})
//       },
//       ...extraVariablesValues,
//     },
//     fetchPolicy,
//     nextFetchPolicy,
//     notifyOnNetworkStatusChange,
//     ssr: apolloSSRFlag(ssr),
//     skip: skipQuery,
//     client: apolloClient,
//   })
//   if (error) {
//     // This error was already caught by the apollo middleware, but the
//     // middleware had no idea who  made the query. To aid in debugging, log a
//     // stack trace here.
//     // eslint-disable-next-line no-console
//     console.error(error.message)
//   }
//   const document: FragmentTypes[FragmentTypeName] | undefined = data && data[resolverName] && data[resolverName].result
//   // TS can't deduce that either the document or the error are set and thus loading is inferred to be of type boolean always (instead of either true or false)
//   return {
//     document, data, error,
//     loading: loading && !skipQuery,
//     ...rest
//   } as TReturn<FragmentTypeName>
// }
