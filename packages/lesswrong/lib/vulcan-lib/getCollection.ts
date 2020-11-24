
export const Collections: Array<CollectionBase<any>> = [];
const collectionsByName: Partial<Record<CollectionNameString,any>> = {};

export const registerCollection = (collection: CollectionBase<any>) => {
  Collections.push(collection);
  collectionsByName[collection.collectionName] = collection;
}

export const getCollection = <N extends CollectionNameString>(name: N): CollectionsByName[N] => {
  return collectionsByName[name]!;
}

export const getCollectionByTypeName = (typeName: string): CollectionBase<any> => {
  return Collections.find(c => c.typeName === typeName)!;
}
