import { MongoCollection } from '../mongoCollection';
import PgCollection from '../sql/PgCollection';
import SwitchingCollection from '../SwitchingCollection';
import { getDefaultFragmentText, registerFragment } from './fragments';
import { registerCollection } from './getCollection';
import { addGraphQLCollection } from './graphql';
import { camelCaseify } from './utils';
import { pluralize } from './pluralize';
import { forceCollectionTypeSetting } from '../instanceSettings';
export * from './getCollection';

// When used in a view, set the query so that it returns rows where a field is
// null or is missing. Equivalent to a search with mongo's `field:null`, except
// that null can't be used this way within Vulcan views because it's ambiguous
// between searching for null/missing, vs overriding the default view to allow
// any value.
export const viewFieldNullOrMissing = {nullOrMissing:true};

// When used in a view, set the query so that any value for this field is
// permitted, overriding constraints from the default view if they exist.
export const viewFieldAllowAny = {allowAny:true};

// TODO: find more reliable way to get collection name from type name?
export const getCollectionName = (typeName: string): CollectionNameString => pluralize(typeName) as CollectionNameString;

// TODO: find more reliable way to get type name from collection name?
export const getTypeName = (collectionName: CollectionNameString) => collectionName.slice(0, -1);

declare global {
  type CollectionType = "mongo" | "pg" | "switching";
}

const pickCollectionType = (collectionType?: CollectionType) => {
  collectionType = forceCollectionTypeSetting.get() ?? collectionType;
  switch (collectionType) {
  case "pg":
    return PgCollection;
  case "switching":
    return SwitchingCollection;
  default:
    return MongoCollection;
  }
}

export const createCollection = <
  N extends CollectionNameString,
  T extends DbObject=ObjectsByCollectionName[N]
>(options: {
  typeName: string,
  collectionName: N,
  collectionType?: CollectionType,
  schema: SchemaType<T>,
  generateGraphQLSchema?: boolean,
  dbCollectionName?: string,
  collection?: any,
  resolvers?: any,
  mutations?: any,
  logChanges?: boolean,
}): any => {
  const {
    typeName,
    collectionName,
    collectionType,
    schema,
    generateGraphQLSchema = true,
    dbCollectionName,
  } = options;

  const Collection = pickCollectionType(collectionType);

  // initialize new Mongo collection
  const collection = new Collection(dbCollectionName ? dbCollectionName : collectionName.toLowerCase(), { _suppressSameNameError: true }) as unknown as CollectionBase<T>;

  // decorate collection with options
  collection.options = options as any;

  // add typeName if missing
  collection.typeName = typeName;
  collection.options.typeName = typeName;
  collection.options.singleResolverName = camelCaseify(typeName);
  collection.options.multiResolverName = camelCaseify(pluralize(typeName));

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

  return collection;
};
