import { pluralize, Utils } from '../vulcan-lib';
import { getCollectionByTypeName } from '../vulcan-lib/getCollection';
import { getMultiResolverName, findWatchesByTypeName, getUpdateMutationName, getCreateMutationName, getDeleteMutationName } from './utils';
import { viewTermsToQuery } from '../utils/viewUtils';
import type { ApolloClient, ApolloCache } from '@apollo/client';
import { loggerConstructor } from '../utils/logging';

export type MingoDocument = any;
export type MingoQueryResult = {totalCount: number, results: MingoDocument[], __typename: string};
export type MingoSelector = MongoSelector<any>;
export type MingoSort = MongoSort<any>;


export const updateCacheAfterCreate = (typeName: string, client: ApolloClient<any>) => {
  const mutationName = getCreateMutationName(typeName);
  return (store: ApolloCache<any>, mutationResult: any) => {
    const { data: { [mutationName]: {data: document} } } = mutationResult
    //updateEachQueryResultOfType({ func: handleCreateMutation, store, typeName,  document })
    invalidateEachQueryThatWouldReturnDocument({client, store, typeName, document});
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

export const updateEachQueryResultOfType = ({ store, typeName, func, document }: {
  store: ApolloCache<any>,
  typeName: string,
  func: (props: {document: any, results: MingoQueryResult, parameters: any, typeName: string})=>MingoQueryResult,
  document: MingoDocument,
}) => {
  const watchesToUpdate = findWatchesByTypeName(store, typeName)
  watchesToUpdate.forEach(({query, variables}: {query: any, variables: any}) => {
    const { input: { terms } } = variables
    const data: any = store.readQuery({query, variables})
    const multiResolverName = getMultiResolverName(typeName);
    const parameters = viewTermsToQuery(getCollectionByTypeName(typeName).collectionName, terms);
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
  
  const watchesToCheck = findWatchesByTypeName(store, typeName)
  watchesToCheck.forEach(({query, variables}: {query: any, variables: any}) => {
    const { input: { terms } } = variables
    const parameters = viewTermsToQuery(getCollectionByTypeName(typeName).collectionName, terms);
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


export const handleDeleteMutation = ({ document, results, typeName }: {
  document: MingoDocument,
  results: MingoQueryResult,
  typeName: string
}): MingoQueryResult => {
  if (!document) return results;
  results = Utils.mingoRemoveFromSet(results, document);

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
export const handleUpdateMutation = ({ document, results, parameters: { selector, options }, typeName }: {
  document: MingoDocument,
  results: MingoQueryResult,
  parameters: any,
  typeName: string,
}) => {
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
