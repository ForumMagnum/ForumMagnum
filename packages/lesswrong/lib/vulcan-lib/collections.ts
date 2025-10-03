import { pluralize } from './pluralize';
import Collection from "@/server/sql/PgCollection"

// TODO: find more reliable way to get collection name from type name?
export const graphqlTypeToCollectionName = (typeName: string): CollectionNameString => pluralize(typeName) as CollectionNameString;

// TODO: find more reliable way to get type name from collection name?
export const collectionNameToGraphQLType = (collectionName: CollectionNameString) => collectionName.slice(0, -1);

export const createCollection = <N extends CollectionNameString, Options extends CollectionOptions<N>>(
  options: Options,
): Collection<Options['collectionName']> => {
  const collection = new Collection<N>(options);

  return collection;
};
