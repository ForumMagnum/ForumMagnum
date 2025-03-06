import sortBy from "lodash/sortBy";

// These are populated by calls to `createCollection`
export const Collections: CollectionBase<CollectionNameString>[] = [];
// const allCollections = {} as CollectionsByName;
// const collectionsByLowercaseName: Record<string, CollectionBase<CollectionNameString>> = {};

export const getCollection = <N extends CollectionNameString>(name: N): CollectionBase<N> => {
  const { allCollections }: { allCollections: CollectionsByName } = require('../collections/allCollections');
  if (name in allCollections && allCollections[name])
    return allCollections[name] as CollectionBase<N>;
  // If the collection isn't in collectionsByName, recheck case-insensitive.
  // (This shouldn't ever come up, but it's hard to verify that it doesn't
  // because of legacy Vulcan stuff.)
  const collection = Collections.find(
    (collection) => name === collection.collectionName || name === collection.collectionName.toLowerCase()
  );
  // If we still can't find the collection, throw an exception. If the argument
  // really is a CollectionNameString, this can only happen early in
  // intiailization when createCollection calls haven't happened yet.
  if (!collection)
    throw new Error("Invalid collection name: " + name);
  return collection as CollectionBase<N>;
};

export const getCollectionByTypeName = (typeName: string): CollectionBase<any> => {
  const { collectionsByTypeName }: { collectionsByTypeName: Record<string, CollectionBase<CollectionNameString>> } = require('../collections/allCollections');
  const collection = collectionsByTypeName[typeName];
  if (!collection) throw new Error("Invalid typeName: " + typeName);
  return collection;
};

export const getCollectionByTableName = (tableName: string): CollectionBase<any> => {
  const { collectionsByLowercaseName }: { collectionsByLowercaseName: Record<string, CollectionBase<CollectionNameString>> } = require('../collections/allCollections');

  if (tableName in collectionsByLowercaseName)
    return (collectionsByLowercaseName as AnyBecauseTodo)[tableName];
  throw new Error(`Invalid table name: ${tableName}`);
};

export const isValidCollectionName = (name: string): name is CollectionNameString => {
  const { allCollections }: { allCollections: CollectionsByName } = require('../collections/allCollections');
  if (name in allCollections)
    return true;
  // Case-insensitive search fallback, similar to getCollection.
  return !!Collections.find(
    (collection) => name === collection.collectionName || name === collection.collectionName.toLowerCase()
  );
};

// Add a collection to Collections and collectionsByName. Should only be called
// from createCollection.
export const registerCollection = <N extends CollectionNameString>(collection: CollectionBase<N>): void => {
  const { allCollections, collectionsByLowercaseName }: { allCollections: CollectionsByName, collectionsByLowercaseName: Record<string, CollectionBase<CollectionNameString>> } = require('../collections/allCollections');

  Collections.push(collection as CollectionBase<CollectionNameString>);
  allCollections[collection.collectionName] = collection as unknown as CollectionsByName[N];
  (collectionsByLowercaseName as AnyBecauseTodo)[collection.collectionName.toLowerCase()] = collection;
};

// Get a list of all collections, sorted by collection name.
export const getAllCollections = (): Array<CollectionBase<CollectionNameString>> => {
  const { allCollections }: { allCollections: CollectionsByName } = require('../collections/allCollections');
  return sortBy(Object.values(allCollections), (c) => c.collectionName);
};

export const getCollectionsByName = (): CollectionsByName => require('../collections/allCollections').allCollections;

export const typeNameToCollectionName = (typeName: string): CollectionNameString => {
  return getCollectionByTypeName(typeName).collectionName;
};

export const collectionNameToTypeName = (collectionName: CollectionNameString) => {
  return getCollection(collectionName).typeName;
};
