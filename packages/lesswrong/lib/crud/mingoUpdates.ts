import Mingo from 'mingo';

/*
 * This file contains helper functions for looking at mongodb-style selectors
 * and result sets, particularly for the useMulti resolver, and incrementally
 * updating the result set client-side given a mutation, using mingo to
 * determine whether added results match the selectors and to sort the lists.
 *
 * What this amounts to in practice is that some created and update  operations,
 * such as submitting a comment, operating on a user in the moderation UI, get
 * reflected in what's displayed without a refresh, without the components that
 * do those create/update operations needing to think too much about
 * invalidation.
 *
 * Here be dragons! This feature is brittle and has been a source of bugs in
 * the past.
 */

export type MingoDocument = any;
export type MingoQueryResult = {totalCount: number, results: MingoDocument[], __typename?: string};
export type MingoSelector = MongoSelector<any>;
export type MingoSort = MongoSort<any>;

/**
 * Test if a document is matched by a given selector
 */
export const mingoBelongsToSet = (document: MingoDocument, selector: MingoSelector) => {
  try {
    const mingoQuery = new Mingo.Query(selector);
    return mingoQuery.test(document);
  } catch(err) {
    // eslint-disable-next-line no-console
    console.error(err)
    return false
  }
};

/**
 * Test if a document is already in a result set
 */
export const mingoIsInSet = (data: MingoQueryResult, document: MingoDocument) => {
  return data.results.find((item: MingoDocument) => item._id === document._id);
}

/**
 * Add a document to a set of results
 */
export const mingoAddToSet = (queryData: MingoQueryResult, document: MingoDocument) => {
  const newData = {
    results: [...queryData.results, document],
    totalCount: queryData.totalCount + 1,
  };
  return newData;
};

/**
 * Update a document in a set of results
 */
export const mingoUpdateInSet = (queryData: MingoQueryResult, document: MingoDocument) => {
  const oldDocument = queryData.results.find(item => item._id === document._id);
  const newDocument = { ...oldDocument, ...document };
  const index = queryData.results.findIndex(item => item._id === document._id);
  const newResults = [...queryData.results];
  newResults[index] = newDocument;
  const newData = {
    ...queryData,
    results: newResults
  }; // clone
  return newData;
};

/**
 * Reorder results according to a sort
 */
export const mingoReorderSet = (queryData: MingoQueryResult, sort: MingoSort, selector: MingoSelector) => {
  try {
    const mingoQuery = new Mingo.Query(selector);
    const cursor = mingoQuery.find(queryData.results);
    queryData.results = cursor.sort(sort).all();
    return queryData;  
  } catch(err) {
    // eslint-disable-next-line no-console
    console.error(err)
    return queryData
  }
};

/**
 * Remove a document from a set
 */
export const mingoRemoveFromSet = (queryData: MingoQueryResult, document: MingoDocument) => {
  const newData = {
    results: queryData.results.filter(item => item._id !== document._id),
    totalCount: queryData.totalCount - 1,
  };
  return newData;
};
