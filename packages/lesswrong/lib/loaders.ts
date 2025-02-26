import DataLoader from 'dataloader';
import * as _ from 'underscore';


//
// Do a query, with a custom loader for query batching. This effectively does a
// find query, where all of the fields of the query are kept constant within a
// query batch except for one field, which is converted from looking for a
// specific value to being a {$in: [...]} query. The loader caches within one
// http request, and is reset between http requests.
//
//   collection: The collection which contains the objects you're querying for
//   loaderName: A key which identifies this loader. Calls to getWithLoader
//     that share a loaderName will be batched together, and must have an
//     identical baseQuery
//   groupByField: The name of the field whose value varies between queries in
//     the batch.
//   id: The value of the field whose values vary between queries in the batch.
//
export async function getWithLoader<N extends CollectionNameString>(
  context: ResolverContext,
  collection: CollectionBase<N>,
  loaderName: string,
  baseQuery: any={},
  groupByField: string & keyof ObjectsByCollectionName[N],
  id: string,
  options: MongoFindOptions<ObjectsByCollectionName[N]> | undefined = undefined,
): Promise<ObjectsByCollectionName[N][]> {
  if (!context.extraLoaders) {
    context.extraLoaders = {};
  }
  if (!context.extraLoaders[loaderName]) {
    context.extraLoaders[loaderName] = new DataLoader(async (docIDs: Array<string>) => {
      let query = {
        ...baseQuery,
        [groupByField]: {$in: docIDs}
      };
      const queryResults: ObjectsByCollectionName[N][] = await collection.find(query, options).fetch();
      const sortedResults = _.groupBy(queryResults, r=>r[groupByField]);
      return docIDs.map(id => sortedResults[id] || []);
    }, {
      cache: true
    })
  }

  return await context.extraLoaders[loaderName].load(id);
}

/**
 * WARNING!  The function you pass in to the loader _must_ return records in the order that corresponds to the list of ids that gets passed in.
 * By default, queries like `{ _id: { $in: ids } }` _do not_ return results in the same order as the ids passed in; you will likely need to manually reorder records you fetch like this.
 * If you don't do this, you'll be returning field info with objects it doesn't belong to. 
 */
export async function getWithCustomLoader<T, ID>(context: ResolverContext, loaderName: string, id: ID, idsToResults: (ids: Array<ID>) => Promise<T[]>): Promise<T> {
  if (!context.extraLoaders[loaderName]) {
    context.extraLoaders[loaderName] = new DataLoader(idsToResults, { cache: true });
  }

  return await context.extraLoaders[loaderName].load(id);
}

/**
 * Given an array of IDs, load the corresponding objects and return them in an
 * array of the same length, with nulls for any IDs that don't exist.
 *
 * If the same ID is requested multiple times with the same ResolverContext, ie
 * while assembling a response to the same HTTP request, the object will be
 * fetched once and reused.
 *
 * This is a wrapper around `loadMany` on the underlying data loader, which
 * simplifies calling it by translating any instances of `Error` in the result
 * list to a single thrown exception.
 */
export async function loadByIds<N extends CollectionNameString>(context: ResolverContext, collectionName: N, ids: string[]): Promise<(ObjectsByCollectionName[N]|null)[]> {
  const results = await context.loaders[collectionName].loadMany(ids);
  
  // The `dataloader` library returns an array of (result|null|Error), handling
  // the case where loading a subset of objects threw an exception. If this
  // happens, it probably means something has gone wrong with our connection to
  // the database, and we don't want to return an array where some objects are
  // relaced with Error, we just want to throw an exception for the whole batch.

  // Check for any instances of Error in the results, and throw
  for (let result of results) {
    if (result instanceof Error) {
      throw result;
    }
  }

  // Downcast to remove Error from the possible results, and return
  return results as Array<ObjectsByCollectionName[N]|null>;
}
