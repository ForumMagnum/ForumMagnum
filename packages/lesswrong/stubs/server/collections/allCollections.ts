export function getCollection(collectionName: CollectionNameString) {
  throw new Error("getCollection can only be called on the server");
}

export function getAllCollections() {
  throw new Error("getAllCollections can only be called on the server");
}
