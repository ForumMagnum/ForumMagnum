export function getCollectionAccessFilter<N extends CollectionNameString>(collectionName: N) {
  throw new Error(`getCollectionAccessFilter called on the client!`);
}
