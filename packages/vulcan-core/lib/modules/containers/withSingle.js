
import { graphql, useQuery } from 'react-apollo';
import gql from 'graphql-tag';
import { singleClientTemplate, Utils, extractCollectionInfo, extractFragmentInfo } from 'meteor/vulcan:lib';

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

export default function withSingle({ collectionName, collection, fragment, fragmentName, extraVariables, fetchPolicy, propertyName = 'document', extraQueries }) {
  ({ collectionName, collection } = extractCollectionInfo({ collectionName, collection }));
  ({ fragmentName, fragment } = extractFragmentInfo({ fragment, fragmentName }, collectionName));

  const query = getGraphQLQueryFromOptions({ extraVariables, extraQueries, collectionName, collection, fragment, fragmentName })
  const resolverName = getResolverNameFromOptions({ collectionName, collection })
  const typeName = collection.options.typeName
  
  return graphql(query, {
    alias: `with${typeName}`,

    options({ documentId, slug, selector = { documentId, slug }, ...rest }) {
      // OpenCrud backwards compatibility
      // From the provided arguments, pick the key-value pairs where the key is also in extraVariables option
      const extraVariablesValues = _.pick(rest, Object.keys(extraVariables || {}))  
      const graphQLOptions = {
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
    props: returnedProps => {
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

export function useSingle({ collectionName, 
  collection, 
  fragment, 
  fragmentName, 
  extraVariables, 
  fetchPolicy, 
  propertyName, 
  extraQueries, 
  documentId, 
  extraVariablesValues
}) {
  const query = getGraphQLQueryFromOptions({ extraVariables, extraQueries, collectionName, collection, fragment, fragmentName })
  const resolverName = getResolverNameFromOptions({ collectionName, collection })
  const { data, ...rest } = useQuery(query, { 
    variables: { input: { selector: { documentId } }, ...extraVariablesValues }, 
    fetchPolicy 
  })
  const document = data && data[resolverName] && data[resolverName].result
  return { document, data, ...rest }
}
