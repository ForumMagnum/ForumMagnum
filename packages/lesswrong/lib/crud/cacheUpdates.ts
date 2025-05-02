import { pluralize } from '../vulcan-lib/pluralize';
import { typeNameToCollectionName } from '../generated/collectionTypeNames';
import { getMultiResolverName, findWatchesByTypeName, getUpdateMutationName, getCreateMutationName, getDeleteMutationName } from './utils';
import { viewTermsToQuery } from '../utils/viewUtils';
import type { ApolloClient, ApolloCache } from '@apollo/client';
import { loggerConstructor } from '../utils/logging';
import { mingoAddToSet, mingoBelongsToSet, MingoDocument, mingoIsInSet, MingoQueryResult, mingoRemoveFromSet, mingoReorderSet, mingoUpdateInSet } from "./mingoUpdates";

export const updateCacheAfterCreate = (typeName: keyof typeof typeNameToCollectionName, client: ApolloClient<any>) => {
  const mutationName = getCreateMutationName(typeName);
  return (store: ApolloCache<any>, mutationResult: any) => {
    const { data: { [mutationName]: {data: document} } } = mutationResult
    //updateEachQueryResultOfType({ func: handleCreateMutation, store, typeName,  document })
    invalidateEachQueryThatWouldReturnDocument({client, store, typeName, document});
  }
}

export const updateCacheAfterUpdate = (typeName: keyof typeof typeNameToCollectionName) => {
  const mutationName = getUpdateMutationName(typeName);
  return (store: ApolloCache<any>, mutationResult: any) => {
    const { data: { [mutationName]: {data: document} } } = mutationResult
    updateEachQueryResultOfType({ func: handleUpdateMutation, store, typeName,  document })
  }
}

export const updateCacheAfterDelete = (typeName: keyof typeof typeNameToCollectionName) => {
  const mutationName = getDeleteMutationName(typeName);
  return (store: ApolloCache<any>, { data: { [mutationName]: {data: document} } }: any) => {
    updateEachQueryResultOfType({ func: handleDeleteMutation, store, typeName, document })
  }
}

export const updateEachQueryResultOfType = ({ store, typeName, func, document }: {
  store: ApolloCache<any>,
  typeName: keyof typeof typeNameToCollectionName,
  func: (props: {document: any, results: MingoQueryResult, parameters: any, typeName: string}) => MingoQueryResult,
  document: MingoDocument,
}) => {
  const watchesToUpdate = findWatchesByTypeName(store, typeName)
  watchesToUpdate.forEach(({query, variables}: {query: any, variables: any}) => {
    const { input: { terms } } = variables
    const data: any = store.readQuery({query, variables})
    if (!data) return;
    const multiResolverName = getMultiResolverName(typeName);
    const collectionName = typeNameToCollectionName[typeName];
    const parameters = viewTermsToQuery(collectionName, terms);
    const results = data[multiResolverName]

    const updatedResults = func({document, results, parameters, typeName})
    const newData = {
      ...data,
      [multiResolverName]: updatedResults
    }
    store.writeQuery({query, data: newData, variables})
  })
}

export const invalidateEachQueryThatWouldReturnDocument = ({ client, store, typeName, document }: {
  client: ApolloClient<any>
  store: ApolloCache<any>
  typeName: keyof typeof typeNameToCollectionName
  document: any
}) => {
  const mingoLogger = loggerConstructor(`mingo-${pluralize(typeName.toLowerCase())}`)
  
  const watchesToCheck = findWatchesByTypeName(store, typeName)
  watchesToCheck.forEach(({query, variables}: {query: any, variables: any}) => {
    const { input: { terms } } = variables
    const collectionName = typeNameToCollectionName[typeName];
    const parameters = viewTermsToQuery(collectionName, terms);
    mingoLogger('parameters', parameters);
    mingoLogger('document', document);
    if (mingoBelongsToSet(document, parameters.selector)) {
      invalidateQuery({client, query, variables});
    }
  });
}

export const invalidateQuery = ({client, query, variables}: {
  client: ApolloClient<any>
  query: any
  variables: any
}) => {
  const observableQuery = client.watchQuery({query, variables})
  void observableQuery.refetch(variables);
}


export const handleDeleteMutation = ({ document, results, typeName }: {
  document: MingoDocument,
  results: MingoQueryResult,
  typeName: string
}): MingoQueryResult => {
  if (!document) return results;
  results = mingoRemoveFromSet(results, document);

  return {
    ...results,
    __typename: `Multi${typeName}Output`
  };
}

export const handleCreateMutation = ({ document, results, parameters: { selector, options }, typeName }: {
  document: MingoDocument,
  results: MingoQueryResult,
  parameters: any,
  typeName: string,
}) => {
  if (!document) return results;

  if (mingoBelongsToSet(document, selector)) {
    if (!mingoIsInSet(results, document)) {
      // make sure document hasn't been already added as this may be called several times
      results = mingoAddToSet(results, document);
    }
    results = mingoReorderSet(results, options.sort, selector);
  }

  return {
    ...results,
    __typename: `Multi${typeName}Output`
  };
}

// Theoretically works for upserts
export const handleUpdateMutation = ({ document, results, parameters: { selector, options }, typeName }: {
  document: MingoDocument,
  results: MingoQueryResult,
  parameters: any,
  typeName: string,
}) => {
  if (!document) return results;
  if (mingoBelongsToSet(document, selector)) {
    // edited document belongs to the list
    if (!mingoIsInSet(results, document)) {
      // if document wasn't already in list, add it
      results = mingoAddToSet(results, document);
    } else {
      // if document was already in the list, update it
      results = mingoUpdateInSet(results, document);
    }
    results = mingoReorderSet(results, options.sort, selector);
  } else {
    // if edited doesn't belong to current list anymore (based on view selector), remove it
    results = mingoRemoveFromSet(results, document);
  }
  return {
    ...results,
    __typename: `Multi${typeName}Output`
  }
}
