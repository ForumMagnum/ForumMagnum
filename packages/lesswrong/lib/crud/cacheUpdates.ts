import { pluralize, Utils } from '../vulcan-lib';
import { getCollectionByTypeName } from '../vulcan-lib/getCollection';
import { getMultiResolverName, findWatchesByTypeName, getUpdateMutationName, getCreateMutationName, getDeleteMutationName } from './utils';
import { viewTermsToQuery } from '../utils/viewUtils';
import type { ApolloClient, ApolloCache } from '@apollo/client';
import { loggerConstructor } from '../utils/logging';


export const updateCacheAfterCreate = (typeName: string, client: ApolloClient<any>) => {
  const mutationName = getCreateMutationName(typeName);
  return (store: ApolloCache<any>, mutationResult: any) => {
    const { data: { [mutationName]: {data: document} } } = mutationResult
    //updateEachQueryResultOfType({ func: handleCreateMutation, store, typeName,  document })
    invalidateEachQueryThatWouldReturnDocument({client, store, typeName, document});;
  }
}

export const updateCacheAfterUpdate = (typeName: string) => {
  const mutationName = getUpdateMutationName(typeName);
  return (store: ApolloCache<any>, mutationResult: any) => {
    const { data: { [mutationName]: {data: document} } } = mutationResult
    updateEachQueryResultOfType({ func: handleUpdateMutation, store, typeName,  document })
  }
}

export const updateCacheAfterDelete = (typeName: string) => {
  const mutationName = getDeleteMutationName(typeName);
  return (store: ApolloCache<any>, { data: { [mutationName]: {data: document} } }: any) => {
    updateEachQueryResultOfType({ func: handleDeleteMutation, store, typeName, document })
  }
}

export const updateEachQueryResultOfType = ({ store, typeName, func, document }) => {
  const watchesToUpdate = findWatchesByTypeName(Array.from(store.watches), typeName)
  watchesToUpdate.forEach(({query, variables }) => {
    const { input: { terms } } = variables
    const data = store.readQuery({query, variables})
    const multiResolverName = getMultiResolverName(typeName);
    const parameters = getParametersByTypeName(terms, typeName);
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
  typeName: string
  document: any
}) => {
  const mingoLogger = loggerConstructor(`mingo-${pluralize(typeName.toLowerCase())}`)
  const watches = (store as any).watches; // Use a private variable on ApolloCache to cover an API hole (no good way to enumerate queries in the cache)
  
  const watchesToCheck = findWatchesByTypeName(Array.from(watches), typeName)
  watchesToCheck.forEach(({query, variables }) => {
    const { input: { terms } } = variables
    const parameters = getParametersByTypeName(terms, typeName);
    mingoLogger('parameters', parameters);
    mingoLogger('document', document);
    if (Utils.mingoBelongsToSet(document, parameters.selector)) {
      invalidateQuery({client, query, variables});
    }
  });
}

const invalidateQuery = ({client, query, variables}: {
  client: ApolloClient<any>
  query: any
  variables: any
}) => {
  const observableQuery = client.watchQuery({query, variables})
  void observableQuery.refetch(variables);
}

const getParametersByTypeName = (terms, typeName) => {
  const collection = getCollectionByTypeName(typeName);
  const collectionName = collection.collectionName;
  return viewTermsToQuery(collectionName, terms); //NOTE: this once passed apolloClient but doesn't anymore
}

export const handleDeleteMutation = ({ document, results, typeName }) => {
  if (!document) return results;
  results = Utils.mingoRemoveFromSet(results, document);

  return {
    ...results,
    __typename: `Multi${typeName}Output`
  };
}

export const handleCreateMutation = ({ document, results, parameters: { selector, options }, typeName }) => {
  if (!document) return results;

  if (Utils.mingoBelongsToSet(document, selector)) {
    if (!Utils.mingoIsInSet(results, document)) {
      // make sure document hasn't been already added as this may be called several times
      results = Utils.mingoAddToSet(results, document);
    }
    results = Utils.mingoReorderSet(results, options.sort, selector);
  }

  return {
    ...results,
    __typename: `Multi${typeName}Output`
  };
}

// Theoretically works for upserts
export const handleUpdateMutation = ({ document, results, parameters: { selector, options }, typeName }) => {
  if (!document) return results;
  if (Utils.mingoBelongsToSet(document, selector)) {
    // edited document belongs to the list
    if (!Utils.mingoIsInSet(results, document)) {
      // if document wasn't already in list, add it
      results = Utils.mingoAddToSet(results, document);
    } else {
      // if document was already in the list, update it
      results = Utils.mingoUpdateInSet(results, document);
    }
    results = Utils.mingoReorderSet(results, options.sort, selector);
  } else {
    // if edited doesn't belong to current list anymore (based on view selector), remove it
    results = Utils.mingoRemoveFromSet(results, document);
  }
  return {
    ...results,
    __typename: `Multi${typeName}Output`
  }
}
