import { pluralize } from './pluralize';
import Collection from "@/server/sql/PgCollection"

// TODO: find more reliable way to get collection name from type name?
export const graphqlTypeToCollectionName = (typeName: string): CollectionNameString => pluralize(typeName) as CollectionNameString;

// TODO: find more reliable way to get type name from collection name?
export const collectionNameToGraphQLType = (collectionName: CollectionNameString) => collectionName.slice(0, -1);

export const createCollection = <N extends CollectionNameString>(
  options: CollectionOptions<N>,
): CollectionsByName[N] => {
  const collection: CollectionBase<N> = new Collection(options);

  // TODO: This type should coerce better?
  return collection as unknown as CollectionsByName[N];
};
