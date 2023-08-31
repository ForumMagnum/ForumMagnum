import sortBy from 'lodash/sortBy';

export const Collections: Array<CollectionBase<any>> = [];
const collectionsByName: Partial<CollectionBasesByName> = {};
const collectionsByLowercaseName: Partial<Record<string,CollectionBase<any>>> = {};

export const getCollection = <T extends CollectionNameString>(name: T): CollectionBase<ObjectsByCollectionName[T]> => {
  if (name in collectionsByName)
    return collectionsByName[name]!;
  
  // If the collection isn't in collectionsByName, recheck case-insensitive.
  // (This shouldn't ever come up, but it's hard to verify that it doesn't
  // because of legacy Vulcan stuff.)
  const collection = Collections.find(
    ({ options: { collectionName } }) =>
      name === collectionName || name === collectionName.toLowerCase()
  );
  
  // If we still can't find the collection, throw an exception. If the argument
  // really is a CollectionNameString, this can only happen early in
  // intiailization when createCollection calls haven't happened yet.
  if (!collection)
    throw new Error("Invalid collection name: "+name);
  
  return collection;
}

export const getCollectionByTypeName = (typeName: string): CollectionBase<any> => {
  const collection = Collections.find(c => c.typeName === typeName);
  if (!collection) throw new Error("Invalid typeName: "+typeName);
  return collection;
}

export const getCollectionByTableName = (tableName: string): CollectionBase<any> => {
  if (tableName in collectionsByLowercaseName)
    return (collectionsByLowercaseName as AnyBecauseTodo)[tableName];
  throw new Error(`Invalid table name: ${tableName}`);
}

export const isValidCollectionName = (name: string): name is CollectionNameString => {
  if (name in collectionsByName)
    return true;
  
  // Case-insensitive search fallback, similar to getCollection.
  return !!Collections.find(
    ({ options: { collectionName } }) =>
      name === collectionName || name === collectionName.toLowerCase()
  );
}

// Add a collection to Collections and collectionsByName. Should only be called
// from createCollection.
export const registerCollection = <T extends DbObject>(collection: CollectionBase<T, CollectionNameOfObject<T>>): void => {
  Collections.push(collection);
  Object.assign(collectionsByName, { [collection.collectionName]: collection });
  (collectionsByLowercaseName as AnyBecauseTodo)[collection.collectionName.toLowerCase()] = collection;
}

// Get a list of all collections, sorted by collection name.
export const getAllCollections = (): Array<CollectionBase<any>> => {
  return sortBy(Collections, c=>c.collectionName);
}
