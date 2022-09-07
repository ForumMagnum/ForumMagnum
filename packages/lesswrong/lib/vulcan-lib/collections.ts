import { CollectionB, CollectionBaseOptions } from '../../lib/mongoCollection';
import * as _ from 'underscore';
import { getDefaultFragmentText, registerFragment } from './fragments';
import { registerCollection } from './getCollection';
import { addGraphQLCollection } from './graphql';
import { pluralize } from './pluralize';
export * from './getCollection';

// 'Maximum documents per request'
// const maxDocumentsPerRequestSetting = new DatabasePublicSetting<number>('maxDocumentsPerRequest', 5000)

// TODO: find more reliable way to get collection name from type name?
export const getCollectionName = (typeName): CollectionNameString => pluralize(typeName) as CollectionNameString;

// TODO: find more reliable way to get type name from collection name?
export const getTypeName = (collectionName: CollectionNameString) => collectionName.slice(0, -1);

/**
 * @summary Add a default view function.
 * @param {Function} view
 */
// MongoCollection.prototype.addDefaultView = function(view) {
//   this.defaultView = view;
// };

/**
 * @summary Add a named view function.
 * @param {String} viewName
 * @param {Function} view
 */
// MongoCollection.prototype.addView = function(viewName, view) {
//   this.views[viewName] = view;
// };

export const createCollection = <
  N extends CollectionNameString,
  T extends DbObject=ObjectsByCollectionName[N]
>(options: CollectionBaseOptions<N, T>): any => {
  const {
    typeName,
    collectionName,
    schema,
    generateGraphQLSchema = true,
    dbCollectionName,
  } = options;

  // const collectionBaseOptions: CollectionBaseOptions<N, T> = {
  //   ...options
  // }

  const collection = new CollectionB<T>(dbCollectionName ? dbCollectionName : collectionName.toLowerCase(), options);
  // initialize new Mongo collection
  // const collection = new MongoCollection(dbCollectionName ? dbCollectionName : collectionName.toLowerCase(), { _suppressSameNameError: true }); // as unknown as CollectionBase<T>;

  // // decorate collection with options
  // collection.options = options as any;

  // // add typeName if missing
  // collection.typeName = typeName;
  // collection.options.typeName = typeName;
  // collection.options.singleResolverName = camelCaseify(typeName);
  // collection.options.multiResolverName = camelCaseify(pluralize(typeName));

  // // add collectionName if missing
  // collection.collectionName = collectionName;
  // collection.options.collectionName = collectionName;

  // // add views
  // collection.views = {};

  // // Schema fields, passed as the schema option to createCollection or added
  // // later with addFieldsDict. Do not access directly; use getSchema.
  // collection._schemaFields = schema;
  // // Schema fields, but converted into the format used by the simple-schema
  // // library. This is a cache of the conversion; when _schemaFields changes it
  // // should be invalidated by setting it to null. Do not access directly; use
  // // getSimpleSchema.
  // collection._simpleSchema = null;

  if (generateGraphQLSchema) {
    // add collection to list of dynamically generated GraphQL schemas
    addGraphQLCollection(collection);
  }

  // ------------------------------------- Default Fragment -------------------------------- //

  const defaultFragment = getDefaultFragmentText(collection, schema);
  if (defaultFragment) registerFragment(defaultFragment);

  registerCollection(collection);

  return collection;
};
