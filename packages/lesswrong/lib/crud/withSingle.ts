import { ApolloClient, NormalizedCacheObject, ApolloError, gql, useQuery, FetchPolicy, WatchQueryFetchPolicy } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import * as _ from 'underscore';
import { extractCollectionInfo, extractFragmentInfo, getCollection, getFragment } from '../vulcan-lib';
import { camelCaseify } from '../vulcan-lib/utils';

// Single query used on the client
//
// query singleMovieQuery($input: SingleMovieInput) {
//   movie(input: $input) {
//     result {
//       _id
//       name
//       __typename
//     }
//     __typename
//   }
// }
// LESSWRONG: Add extraVariables String
const singleClientTemplate = ({ typeName, fragmentName, extraQueries, extraVariablesString }) =>
`query single${typeName}Query($input: Single${typeName}Input, ${extraVariablesString || ''}) {
  ${camelCaseify(typeName)}(input: $input) {
    result {
      ...${fragmentName}
    }
    __typename
  }
  ${extraQueries ? extraQueries : ''}
}`;

export function getGraphQLQueryFromOptions({ extraVariables, extraQueries, collection, fragment, fragmentName }) {
  const collectionName = collection.collectionName;
  ({ fragmentName, fragment } = extractFragmentInfo({ fragment, fragmentName }, collectionName));
  const typeName = collection.options.typeName;

  // LESSWRONG MODIFICATION: Allow the passing of extraVariables so that you can have field-specific queries
  let extraVariablesString = ''
  if (extraVariables) {
    extraVariablesString = Object.keys(extraVariables).map(k => `$${k}: ${extraVariables[k]}`).join(', ')
  }
  
  const query = gql`
    ${singleClientTemplate({ typeName, fragmentName, extraQueries, extraVariablesString })}
    ${fragment}
  `;
  
  return query
}

export function getResolverNameFromOptions<T extends DbObject>(collection: CollectionBase<T>): string {
  const typeName = collection.options.typeName;
  return camelCaseify(typeName);
}

export function withSingle({
  collectionName, collection,
  fragmentName, fragment,
  extraVariables, fetchPolicy, propertyName = 'document', extraQueries
}: {
  collectionName?: CollectionNameString,
  collection?: any,
  fragmentName?: FragmentName,
  fragment?: any,
  extraVariables?: any,
  fetchPolicy?: WatchQueryFetchPolicy,
  propertyName?: string,
  extraQueries?: any,
}) {
  ({ collectionName, collection } = extractCollectionInfo({ collectionName, collection }));
  ({ fragmentName, fragment } = extractFragmentInfo({ fragment, fragmentName }, collectionName));

  const query = getGraphQLQueryFromOptions({ extraVariables, extraQueries, collection, fragment, fragmentName })
  const resolverName = getResolverNameFromOptions(collection)
  const typeName = collection.options.typeName
  
  return graphql(query, {
    alias: `with${typeName}`,

    options(props) {
      const { documentId, slug, selector = { documentId, slug }, ...rest } = props as any;
      // OpenCrud backwards compatibility
      // From the provided arguments, pick the key-value pairs where the key is also in extraVariables option
      const extraVariablesValues = _.pick(rest, Object.keys(extraVariables || {}))  
      const graphQLOptions: any = {
        variables: {
          input: {
            selector,
          },
          ...extraVariablesValues
        }
      };

      if (fetchPolicy) {
        graphQLOptions.fetchPolicy = fetchPolicy;
      }

      return graphQLOptions;
    },
    props: (returnedProps: any) => {
      const { /* ownProps, */ data } = returnedProps;

      const props = {
        loading: data.loading,
        refetch: data.refetch,
        // document: Utils.convertDates(collection, data[singleResolverName]),
        [propertyName]: data[resolverName] && data[resolverName].result,
        fragmentName,
        fragment,
        data
      };

      if (data.error) {
        // This error was already caught by the apollo middleware, but the
        // middleware had no idea who  made the query. To aid in debugging, log a
        // stack trace here.
        // eslint-disable-next-line no-console
        console.error(data.error.message)
        // get graphQL error (see https://github.com/thebigredgeek/apollo-errors/issues/12)
        props.error = data.error.graphQLErrors[0];
      }

      return props;
    }
  });
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

export type UseSingleProps<FragmentTypeName extends keyof FragmentTypes> = {
  collectionName: CollectionNameString,
  fragmentName?: FragmentTypeName,
  fragment?: any,
  extraVariables?: Record<string,any>,
  fetchPolicy?: WatchQueryFetchPolicy,
  notifyOnNetworkStatusChange?: boolean,
  propertyName?: string,
  extraQueries?: any,
  documentId: string|undefined,
  allowNull?: boolean,
  extraVariablesValues?: any,
  skip?: boolean,
  apolloClient?: ApolloClient<NormalizedCacheObject>,
}

export function useSingle<FragmentTypeName extends keyof FragmentTypes>({
  collectionName,
  fragmentName, fragment,
  extraVariables,
  fetchPolicy,
  notifyOnNetworkStatusChange,
  propertyName,
  extraQueries,
  documentId,
  allowNull,
  extraVariablesValues,
  skip=false,
  apolloClient,
}: UseSingleProps<FragmentTypeName>): TReturn<FragmentTypeName> {
  const collection = getCollection(collectionName);
  const query = getGraphQLQueryFromOptions({ extraVariables, extraQueries, collection, fragment, fragmentName })
  const resolverName = getResolverNameFromOptions(collection)
  // TODO: Properly type this generic query
  const { data, error, ...rest } = useQuery(query, {
    variables: {
      input: {
        selector: { documentId },
        ...(allowNull && {allowNull: true})
      },
      ...extraVariablesValues
    },
    fetchPolicy,
    notifyOnNetworkStatusChange,
    ssr: true,
    skip: skip || !documentId,
    client: apolloClient,
  })
  if (error) {
    // This error was already caught by the apollo middleware, but the
    // middleware had no idea who  made the query. To aid in debugging, log a
    // stack trace here.
    // eslint-disable-next-line no-console
    console.error(error.message)
  }
  const document: FragmentTypes[FragmentTypeName] | undefined = data && data[resolverName] && data[resolverName].result
  // TS can't deduce that either the document or the error are set and thus loading is inferred to be of type boolean always (instead of either true or false)
  return { document, data, error, ...rest } as TReturn<FragmentTypeName>
}

/**
 * Load a document by ID, callback-style. Should only be called from event
 * handlers and useEffect; calling this from directly inside a render function
 * will not work. In the common case where a React component is loading data
 * based on its props, you should use useSingle instead.
 *
 * Beware: While the signature of this function is straightforward, the
 * circumstances in which you would actually have to use it are likely to
 * involve tricky concurrency issues.
 *
 * Returns the loaded document, or null if there's no document with that ID or
 * the logged in user doesn't have access to that document. If the network
 * request fails, throw an exception.
 *
 * TODO: Check that the above about error handling is actually true.
 *
 * Use this if a component's loading behavior is too dynamic to capture in a
 * useSingle hook.
 */
export const loadSingle = async <N extends keyof FragmentTypes>({documentId, client, fragmentName, collectionName, fetchPolicy="network-only"}: {
  documentId: string,
  client: ApolloClient<NormalizedCacheObject>,
  fragmentName: N,
  collectionName: CollectionNamesByFragmentName[N],
  fetchPolicy?: FetchPolicy,
}): Promise<FragmentTypes[N]|null> => {
  const collection = getCollection(collectionName);
  const typeName = collection.typeName;
  const resolverName = getResolverNameFromOptions(collection);
  const fragment = getFragment(fragmentName);
  const query = gql`
    ${singleClientTemplate({ typeName, fragmentName, extraQueries: null, extraVariablesString: null })}
    ${fragment}
  `;
  const queryResult = await client.query({
    query,
    fetchPolicy,
    variables: {
      input: {
        selector: { documentId },
      }
    },
  });
  
  const result = queryResult?.data?.[resolverName]?.result;
  return result;
}

export default withSingle;
