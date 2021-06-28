import SimpleSchema from 'simpl-schema';
import { isServer, isAnyTest, runAfterDelay } from './executionEnvironment';
import * as _ from 'underscore';
import { addFieldsDict } from './utils/schemaUtils';
export { getDefaultMutations } from './vulcan-core/default_mutations';
export { getDefaultResolvers } from './vulcan-core/default_resolvers';
import { databaseIsConnected } from './mongoCollection';

// canAutofillDefault: Marks a field where, if its value is null, it should
// be auto-replaced with defaultValue in migration scripts.
SimpleSchema.extendOptions([ 'canAutofillDefault' ]);

// denormalized: In a schema entry, denormalized:true means that this field can
// (in principle) be regenerated from other fields. For now, it's a glorified
// machine-readable comment; in the future, it may have other infrastructure
// attached.
SimpleSchema.extendOptions([ 'denormalized' ]);

// foreignKey: In a schema entry, this is either an object {collection,field},
// or just a string, in which case the string is the collection name and field
// is _id. Indicates that if this field is present and not null, its value
// must correspond to an existing row in the named collection. For example,
//
//   foreignKey: 'Users'
//   means that the value of this field must be the _id of a user;
//
//   foreignKey: {
//     collection: 'Posts',
//     field: 'slug'
//   }
//   means that the value of this field must be the slug of a post.
//
SimpleSchema.extendOptions([ 'foreignKey' ]);

// nullable: In a schema entry, this boolean indicates whether the type system
// should treat this field as nullable 
SimpleSchema.extendOptions([ 'nullable' ]);

declare module "simpl-schema" {
  interface SchemaDefinition {
    canAutofillDefault?: boolean
    denormalized?: boolean
    foreignKey?: CollectionNameString | {collection:CollectionNameString,field:string}
    nullable?: boolean
  }
}

export const expectedIndexes: Partial<Record<CollectionNameString,Array<any>>> = {};

// Returns true if the specified index has a name, and the collection has an
// existing index with the same name but different columns or options.
async function conflictingIndexExists<T extends DbObject>(collection: CollectionBase<T>, index: any, options: any)
{
  if (!options.name)
    return false;
  
  let existingIndexes;
  try {
    existingIndexes = await collection.rawCollection().indexes();
  } catch(e) {
    // If the database is uninitialized (eg, running unit tests starting with a
    // blank DB), this will fail. But the collection will be created by the
    // ensureIndex operation.
    return false;
  }
  
  for (let existingIndex of existingIndexes) {
    if (existingIndex.name === options.name) {
      if (!_.isEqual(existingIndex.key, index)
         || !_.isEqual(existingIndex.partialFilterExpression, options.partialFilterExpression))
      {
        return true;
      }
    }
  }
  
  return false;
}

export function ensureIndex<T extends DbObject>(collection: CollectionBase<T>, index: any, options:any={}): void
{
  void ensureIndexAsync(collection, index, options);
}

export async function ensureIndexAsync<T extends DbObject>(collection: CollectionBase<T>, index: any, options:any={})
{
  if (isServer && !isAnyTest) {
    const buildIndex = async () => {
      if (!databaseIsConnected())
        return;
      try {
        if (options.name && await conflictingIndexExists(collection, index, options)) {
          //eslint-disable-next-line no-console
          console.log(`Differing index exists with the same name: ${options.name}. Dropping.`);
          collection.rawCollection().dropIndex(options.name);
        }
        
        const mergedOptions = {background: true, ...options};
        collection._ensureIndex(index, mergedOptions);
        
        if (!expectedIndexes[collection.collectionName])
          expectedIndexes[collection.collectionName] = [];
        expectedIndexes[collection.collectionName]!.push({
          key: index,
          partialFilterExpression: options.partialFilterExpression,
        });
      } catch(e) {
        //eslint-disable-next-line no-console
        console.error(`Error in ${collection.collectionName}.ensureIndex: ${e}`);
      }
    };
    
    // If running a normal server, defer index creation until 15s after
    // startup. This speeds up testing in the common case, where indexes haven't
    // meaningfully changed (but sending a bunch of no-op ensureIndex commands
    // to the database is still expensive).
    // In unit tests, build indexes immediately, because (a) indexes probably
    // don't exist yet, and (b) building indexes in the middle of a later test
    // risks making that test time out.
    if (isAnyTest) {
      await buildIndex();
    } else {
      runAfterDelay(buildIndex, 15000);
    }
  }
}

export function ensurePgIndex<T extends DbObject>(collection: CollectionBase<T>, indexName: string, indexDescription: string): void {
  void ensurePgIndexAsync(collection, indexName, indexDescription);
}

export async function ensurePgIndexAsync<T extends DbObject>(collection: CollectionBase<T>, indexName: string, indexDescription: string): Promise<void> {
  if (isServer && !isAnyTest) {
    const buildIndex = () => {
      void collection._ensurePgIndex(indexName, indexDescription);
    }
    if (isAnyTest) {
      await buildIndex();
    } else {
      runAfterDelay(buildIndex, 15000);
    }
  }
}

// Given an index partial definition for a collection's default view,
// represented as an index field-list prefix and suffix, plus an index partial
// definition for a specific view on the same collection, combine them into
// a full index definition.
//
// When defining an index prefix/suffix for a default view, every field that is
// in the selector should be in either the prefix or the suffix. If the
// selector is a simple one (a regular value), it should be in the prefix; if
// it's a complex one (an operator), it should be in the suffix. If a field
// appears twice (in both the prefix and the view-specific index, or both the
// view-specific index and the suffix), it will be included only in the first
// position where it appears.
//
//   viewFields: [ordered dictionary] Collection fields from a specific view
//   prefix: [ordered dictionary] Collection fields from the default view
//   suffix: [ordered dictionary] Collection fields from the default view
//
export function combineIndexWithDefaultViewIndex({viewFields, prefix, suffix}: {
  viewFields: any,
  prefix: any,
  suffix: any,
})
{
  let combinedIndex = {...prefix};
  for (let key in viewFields) {
    if (!(key in combinedIndex))
      combinedIndex[key] = viewFields[key];
  }
  for (let key in suffix) {
    if (!(key in combinedIndex))
      combinedIndex[key] = suffix[key];
  }
  return combinedIndex;
}

export function schemaDefaultValue<T extends DbObject>(defaultValue: any): Partial<CollectionFieldSpecification<T>> {
  // Used for both onCreate and onUpdate
  const fillIfMissing = ({newDocument, fieldName}: {
    newDocument: T,
    fieldName: string,
  }) => {
    if (newDocument[fieldName] === undefined) {
      return defaultValue;
    } else {
      return undefined;
    }
  };
  const throwIfSetToNull = ({oldDocument, document, fieldName}: {
    oldDocument: T,
    document: T,
    fieldName: string,
  }) => {
    const wasValid = (oldDocument[fieldName] !== undefined && oldDocument[fieldName] !== null);
    const isValid = (document[fieldName] !== undefined && document[fieldName] !== null);
    if (wasValid && !isValid) {
      throw new Error(`Error updating: ${fieldName} cannot be null or missing`);
    }
  };
  
  return {
    defaultValue: defaultValue,
    onCreate: fillIfMissing,
    onUpdate: throwIfSetToNull,
    canAutofillDefault: true,
  }
}

export function addUniversalFields<T extends DbObject>({ collection, schemaVersion=1 }: {
  collection: CollectionBase<T>,
  schemaVersion?: number
}): void {
  addFieldsDict(collection, {
    _id: {
      optional: true,
      type: String,
      viewableBy: ['guests'],
    },
    schemaVersion: {
      type: Number,
      canRead: ['guests'],
      optional: true,
      ...schemaDefaultValue(schemaVersion),
      onUpdate: () => schemaVersion
    }
  })
  ensureIndex(collection, {schemaVersion: 1});
}

export function isUniversalField(fieldName: string): boolean {
  return fieldName=="_id" || fieldName=="schemaVersion";
}

export function isUnbackedCollection<T extends DbObject>(collection: CollectionBase<T>): boolean
{
  const collectionName: string = collection.collectionName;
  if (collectionName === 'Settings' || collectionName === 'Callbacks') {
    // Vulcan collections with no backing database table
    return true;
  }
  
  return false;
}
