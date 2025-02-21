import { getDefaultFragmentText, registerFragment } from './fragments';
import { registerCollection } from './getCollection';
import { addGraphQLCollection } from './graphql';
import { pluralize } from './pluralize';
export * from './getCollection';
import Collection from "@/server/sql/PgCollection"

// TODO: find more reliable way to get collection name from type name?
export const graphqlTypeToCollectionName = (typeName: string): CollectionNameString => pluralize(typeName) as CollectionNameString;

// TODO: find more reliable way to get type name from collection name?
export const collectionNameToGraphQLType = (collectionName: CollectionNameString) => collectionName.slice(0, -1);

type CreateCollectionOptions <N extends CollectionNameString> = Omit<
  CollectionOptions<N>,
  "interfaces" | "description"
>;

export const createCollection = <N extends CollectionNameString>(
  options: CreateCollectionOptions<N>,
): CollectionsByName[N] => {
  const {
    typeName,
    collectionName,
    schema,
    generateGraphQLSchema = true,
    dbCollectionName,
  } = options;

  // initialize new collection
  const collection: CollectionBase<N> = new Collection(
    dbCollectionName ?? collectionName.toLowerCase(),
    options,
  );

  // add typeName if missing
  collection.typeName = typeName;
  collection.options.typeName = typeName;

  // add collectionName if missing
  collection.collectionName = collectionName;
  collection.options.collectionName = collectionName;

  // add views
  collection.views = {};

  // Schema fields, passed as the schema option to createCollection or added
  // later with addFieldsDict. Do not access directly; use getSchema.
  collection._schemaFields = schema;
  // Schema fields, but converted into the format used by the simple-schema
  // library. This is a cache of the conversion; when _schemaFields changes it
  // should be invalidated by setting it to null. Do not access directly; use
  // getSimpleSchema.
  collection._simpleSchema = null;

  if (generateGraphQLSchema) {
    // add collection to list of dynamically generated GraphQL schemas
    addGraphQLCollection(collection);
  }

  const defaultFragment = getDefaultFragmentText(collection, schema);
  if (defaultFragment) registerFragment(defaultFragment);

  registerCollection(collection);

  // TODO: This type should coerce better?
  return collection as unknown as CollectionsByName[N];
};
