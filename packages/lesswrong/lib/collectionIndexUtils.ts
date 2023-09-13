import * as _ from 'underscore';
import { isServer, isAnyTest, isMigrations } from './executionEnvironment';
import { disableEnsureIndexSetting } from './instanceSettings';
import { getSqlClientOrThrow } from './sql/sqlClient';
import { sleep } from "./utils/asyncUtils";


export const expectedIndexes: Partial<Record<CollectionNameString, Array<MongoIndexSpecification<any>>>> = {};

export const expectedCustomPgIndexes: string[] = [];

// Returns true if the specified index has a name, and the collection has an
// existing index with the same name but different columns or options.
async function conflictingIndexExists<T extends DbObject>(collection: CollectionBase<T>, index: any, options: any) {
  if (!options.name)
    return false;
  
  let existingIndexes;
  try {
    existingIndexes = await collection.rawCollection().indexes();
  } catch(e) {
    // If the database is uninitialized (eg, running unit tests starting with a
    // blank DB), this will fail. But the collection will be created by the
    // ensureIndex operation.
    return false;
  }
  
  for (let existingIndex of existingIndexes) {
    if (existingIndex.name === options.name) {
      if (!_.isEqual(existingIndex.key, index)
         || !_.isEqual(existingIndex.partialFilterExpression, options.partialFilterExpression))
      {
        //eslint-disable-next-line no-console
        console.log(`Expected index: ${JSON.stringify({index, partialFilterExpression: options.partialFilterExpression})}`);
        //eslint-disable-next-line no-console
        console.log(`Found in DB: ${JSON.stringify({index: existingIndex.key, partialFilterExpression: existingIndex.partialFilterExpression})}`);
        
        return true;
      }
    }
  }
  
  return false;
}

export function ensureIndex<T extends DbObject>(collection: CollectionBase<T>, index: any, options:any={}): void {
  if (!expectedIndexes[collection.collectionName])
    expectedIndexes[collection.collectionName] = [];
  expectedIndexes[collection.collectionName]!.push({
    ...options,
    key: index,
  });
  void ensureIndexAsync(collection, index, options);
}

const canEnsureIndexes = () =>
  isServer && !isAnyTest && !isMigrations && !disableEnsureIndexSetting.get();


export async function ensureIndexAsync<T extends DbObject>(collection: CollectionBase<T>, index: any, options:any={}) {
  if (!canEnsureIndexes())
    return;

  await createOrDeferIndex(async () => {
    if (!collection.isConnected())
      return;
    try {
      if (options.name && await conflictingIndexExists(collection, index, options)) {
        //eslint-disable-next-line no-console
        console.log(`Differing index exists with the same name: ${options.name}. Dropping.`);
        
        collection.rawCollection().dropIndex(options.name);
      }
      // console.log(collection.collectionName , index)
      const mergedOptions = {background: true, ...options};
      collection._ensureIndex(index, mergedOptions);
    } catch(e) {
      //eslint-disable-next-line no-console
      console.error(`Error in ${collection.collectionName}.ensureIndex: ${e}`);
    }
  });
}

export const ensureCustomPgIndex = async (sql: string) => {
  if (expectedCustomPgIndexes.includes(sql)) {
    return;
  }
  expectedCustomPgIndexes.push(sql);

  if (!canEnsureIndexes())
    return;

  await createOrDeferIndex(async () => {
    const db = getSqlClientOrThrow();
    await db.any(sql);
  });
}

// Given an index partial definition for a collection's default view,
// represented as an index field-list prefix and suffix, plus an index partial
// definition for a specific view on the same collection, combine them into
// a full index definition.
//
// When defining an index prefix/suffix for a default view, every field that is
// in the selector should be in either the prefix or the suffix. If the
// selector is a simple one (a regular value), it should be in the prefix; if
// it's a complex one (an operator), it should be in the suffix. If a field
// appears twice (in both the prefix and the view-specific index, or both the
// view-specific index and the suffix), it will be included only in the first
// position where it appears.
//
//   viewFields: [ordered dictionary] Collection fields from a specific view
//   prefix: [ordered dictionary] Collection fields from the default view
//   suffix: [ordered dictionary] Collection fields from the default view
//
export function combineIndexWithDefaultViewIndex<T extends DbObject>({viewFields, prefix, suffix}: {
  viewFields: MongoIndexKeyObj<T>,
  prefix: MongoIndexKeyObj<T>,
  suffix: MongoIndexKeyObj<T>,
}): MongoIndexKeyObj<T> {
  let combinedIndex = {...prefix};
  for (let key in viewFields) {
    const keyWithType = key as keyof(typeof viewFields)
    if (!(key in combinedIndex))
      combinedIndex[keyWithType] = viewFields[keyWithType];
  }
  for (let key in suffix) {
    const keyWithType = key as keyof(typeof suffix)
    if (!(key in combinedIndex))
      combinedIndex[keyWithType] = suffix[keyWithType];
  }
  return combinedIndex;
}


let deferredIndexes: Array<()=>Promise<void>> = [];
let deferredIndexesTimer: NodeJS.Timeout|null = null;

/**
 * If running a normal server, defer index creation until 25s after
 * startup. This speeds up testing in the common case, where indexes haven't
 * meaningfully changed (but sending a bunch of no-op ensureIndex commands
 * to the database is still expensive).
 * In unit tests, build indexes immediately, because (a) indexes probably
 * don't exist yet, and (b) building indexes in the middle of a later test
 * risks making that test time out.
 */
const createOrDeferIndex = async (buildIndex: () => Promise<void>) => {
  if (isAnyTest) {
    await buildIndex();
  } else {
    deferredIndexes.push(buildIndex);
    if (deferredIndexesTimer===null) {
      deferredIndexesTimer = setTimeout(createDeferredIndexes, 25000);
    }
  }
}

async function createDeferredIndexes() {
  deferredIndexesTimer = null;
  const deferredIndexesCopy = deferredIndexes;
  deferredIndexes = [];
  
  for (let createIndex of deferredIndexesCopy) {
    await createIndex();
    await sleep(500);
  }
}
