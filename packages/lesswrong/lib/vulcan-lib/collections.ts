import { getDefaultFragmentText, registerFragment } from './fragments';
import { registerCollection } from './getCollection';
import { pluralize } from './pluralize';
import Collection from "@/server/sql/PgCollection"

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
export const graphqlTypeToCollectionName = (typeName: string): CollectionNameString => pluralize(typeName) as CollectionNameString;

// TODO: find more reliable way to get type name from collection name?
export const collectionNameToGraphQLType = (collectionName: CollectionNameString) => collectionName.slice(0, -1);

export const createCollection = <N extends CollectionNameString>(
  options: CollectionOptions<N>,
): CollectionsByName[N] => {
  const collection: CollectionBase<N> = new Collection(options);

  const defaultFragment = getDefaultFragmentText(collection, options.schema);
  if (defaultFragment) registerFragment(defaultFragment);

  registerCollection(collection);

  // TODO: This type should coerce better?
  return collection as unknown as CollectionsByName[N];
};
