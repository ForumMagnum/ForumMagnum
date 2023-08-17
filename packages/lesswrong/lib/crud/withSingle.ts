import { ApolloClient, NormalizedCacheObject, ApolloError, gql, useQuery, WatchQueryFetchPolicy } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import * as _ from 'underscore';
import { extractCollectionInfo, extractFragmentInfo, getCollection } from '../vulcan-lib';
import { camelCaseify } from '../vulcan-lib/utils';

// Template of a GraphQL query for withSingle/useSingle. A sample query might look
// like:
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
const singleClientTemplate = ({ typeName, fragmentName, extraVariablesString }: {
  typeName: string,
  fragmentName: FragmentName,
  extraVariablesString: string,
}) =>
`query single${typeName}Query($input: Single${typeName}Input, ${extraVariablesString || ''}) {
  ${camelCaseify(typeName)}(input: $input) {
    result {
      ...${fragmentName}
    }
    __typename
  }
}`;

/**
 * Given terms/etc for a useSingle query, generate corresponding GraphQL. Exported
 * for use in crossposting-related integrations. You probably don't want to use
 * this directly; in most cases you should use the useSingle hook instead.
 */
export function getGraphQLQueryFromOptions({ extraVariables, collection, fragment, fragmentName }: {
  extraVariables: any,
  collection: any,
  fragment: any,
  fragmentName: FragmentName|undefined,
}) {
  const collectionName = collection.collectionName;
  ({ fragmentName, fragment } = extractFragmentInfo({ fragment, fragmentName }, collectionName));
  const typeName = collection.options.typeName;

  // LESSWRONG MODIFICATION: Allow the passing of extraVariables so that you can have field-specific queries
  let extraVariablesString = ''
  if (extraVariables) {
    extraVariablesString = Object.keys(extraVariables).map(k => `$${k}: ${extraVariables[k]}`).join(', ')
  }
  
  const query = gql`
    ${singleClientTemplate({ typeName, fragmentName, extraVariablesString })}
    ${fragment}
  `;
  
  return query
}

/**
 * Get the name of the GraphQL resolver to use for useSingle on a collection
 * (which is the type name, camel-caseified). Note that this functino might not
 * be getting used everywhere that uses the resolver name, and the resolver name
 * is part of the API given to external sites like GreaterWrong, so this should
 * not be changed.
 */
export function getResolverNameFromOptions<T extends DbObject>(collection: CollectionBase<T>): string {
  const typeName = collection.options.typeName;
  return camelCaseify(typeName);
}

/**
 * HoC for querying a collection for a single document. DEPRECATEDS: you
 * probably want to be using the hook version, useSingle, instead.
 */
export function withSingle({
  collectionName, collection,
  fragmentName, fragment,
  extraVariables, fetchPolicy, propertyName = 'document',
}: {
  collectionName?: CollectionNameString,
  collection?: any,
  fragmentName?: FragmentName,
  fragment?: any,
  extraVariables?: any,
  fetchPolicy?: WatchQueryFetchPolicy,
  propertyName?: string,
}) {
  ({ collectionName, collection } = extractCollectionInfo({ collectionName, collection }));
  ({ fragmentName, fragment } = extractFragmentInfo({ fragment, fragmentName }, collectionName));

  const query = getGraphQLQueryFromOptions({ extraVariables, collection, fragment, fragmentName })
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

// You can pass either `documentId` or `slug`, but not both. The must pass one;
// you pass undefined, in which case the query is skipped.
export type DocumentIdOrSlug =
   {documentId: string|undefined, slug?: never}
  |{slug: string|undefined, documentId?: never};

export type UseSingleProps<FragmentTypeName extends keyof FragmentTypes> = (
  DocumentIdOrSlug & {
    collectionName: CollectionNameString,
    fragmentName?: FragmentTypeName,
    fragment?: any,
    extraVariables?: Record<string,any>,
    extraVariablesValues?: any,
    fetchPolicy?: WatchQueryFetchPolicy,
    notifyOnNetworkStatusChange?: boolean,
    allowNull?: boolean,
    skip?: boolean,
    
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
export function useSingle<FragmentTypeName extends keyof FragmentTypes>({
  documentId, slug,
  collectionName,
  fragmentName, fragment,
  extraVariables,
  extraVariablesValues,
  fetchPolicy,
  notifyOnNetworkStatusChange,
  allowNull,
  skip=false,
  apolloClient,
}: UseSingleProps<FragmentTypeName>): TReturn<FragmentTypeName> {
  const collection = getCollection(collectionName);
  const query = getGraphQLQueryFromOptions({ extraVariables, collection, fragment, fragmentName })
  const resolverName = getResolverNameFromOptions(collection)
  // TODO: Properly type this generic query
  const { data, error, ...rest } = useQuery(query, {
    variables: {
      input: {
        selector: { documentId, slug },
        ...(allowNull && {allowNull: true})
      },
      ...extraVariablesValues
    },
    fetchPolicy,
    notifyOnNetworkStatusChange,
    ssr: true,
    skip: skip || (!documentId && !slug),
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
