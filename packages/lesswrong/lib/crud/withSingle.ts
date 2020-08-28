import { graphql } from '@apollo/client/react/hoc';
import gql from 'graphql-tag';
import { singleClientTemplate, Utils, extractCollectionInfo, extractFragmentInfo } from '../vulcan-lib';
import * as _ from 'underscore';
import { WatchQueryFetchPolicy, useQuery } from '@apollo/client';

export function getGraphQLQueryFromOptions({ extraVariables, extraQueries, collectionName, collection, fragment, fragmentName }) {
  ({ collectionName, collection } = extractCollectionInfo({ collectionName, collection }));
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

export function getResolverNameFromOptions({ collectionName, collection }) {
  ({ collection } = extractCollectionInfo({ collectionName, collection }))
  const typeName = collection.options.typeName;
  return Utils.camelCaseify(typeName);
}

export function withSingle({
  collectionName, collection,
  fragmentName, fragment,
  extraVariables, fetchPolicy, propertyName = 'document', extraQueries
}: {
  collectionName?: CollectionNameString,
  collection?: any,
  fragmentName?: string,
  fragment?: any,
  extraVariables?: any,
  fetchPolicy?: WatchQueryFetchPolicy,
  propertyName?: string,
  extraQueries?: any,
}) {
  ({ collectionName, collection } = extractCollectionInfo({ collectionName, collection }));
  ({ fragmentName, fragment } = extractFragmentInfo({ fragment, fragmentName }, collectionName));

  const query = getGraphQLQueryFromOptions({ extraVariables, extraQueries, collectionName, collection, fragment, fragmentName })
  const resolverName = getResolverNameFromOptions({ collectionName, collection })
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
        // get graphQL error (see https://github.com/thebigredgeek/apollo-errors/issues/12)
        props.error = data.error.graphQLErrors[0];
      }

      return props;
    }
  });
}

export function useSingle<FragmentTypeName extends keyof FragmentTypes>({
  collectionName, collection,
  fragmentName, fragment,
  extraVariables,
  fetchPolicy,
  propertyName,
  extraQueries,
  documentId,
  extraVariablesValues,
  skip=false
}: {
  collectionName?: CollectionNameString,
  collection?: any,
  fragmentName?: FragmentTypeName,
  fragment?: any,
  extraVariables?: Record<string,any>,
  fetchPolicy?: WatchQueryFetchPolicy,
  propertyName?: string,
  extraQueries?: any,
  documentId: string|undefined,
  extraVariablesValues?: any,
  skip?: boolean,
}): {
  document: FragmentTypes[FragmentTypeName]
  loading: boolean,
  error?: any,
  refetch: any,
  data: {
    refetch: any,
  },
} {
  const query = getGraphQLQueryFromOptions({ extraVariables, extraQueries, collectionName, collection, fragment, fragmentName })
  const resolverName = getResolverNameFromOptions({ collectionName, collection })
  const { data, ...rest } = useQuery(query, {
    variables: {
      input: {
        selector: { documentId }
      },
      ...extraVariablesValues
    },
    fetchPolicy,
    ssr: true,
    skip: skip || !documentId,
  })
  const document = data && data[resolverName] && data[resolverName].result
  return { document, data, ...rest }
}

export default withSingle;
