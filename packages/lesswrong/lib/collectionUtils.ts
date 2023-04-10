import SimpleSchema from 'simpl-schema';
import * as _ from 'underscore';
import { ensureIndex } from './collectionIndexUtils';
import { DeferredForumSelect } from './forumTypeUtils';
import { addFieldsDict } from './utils/schemaUtils';
export { getDefaultMutations } from './vulcan-core/default_mutations';
export { getDefaultResolvers } from './vulcan-core/default_resolvers';

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


export function schemaDefaultValue<T extends DbObject>(defaultValue: any): Partial<CollectionFieldSpecification<T>> {
  // Used for both onCreate and onUpdate
  const fillIfMissing = ({newDocument, fieldName}: {
    newDocument: T,
    fieldName: string,
  }) => {
    if (newDocument[fieldName as keyof T] === undefined) {
      return defaultValue instanceof DeferredForumSelect ? defaultValue.get() : defaultValue;
    } else {
      return undefined;
    }
  };
  const throwIfSetToNull = ({oldDocument, document, fieldName}: {
    oldDocument: T,
    document: T,
    fieldName: string,
  }) => {
    const wasValid = (oldDocument[fieldName as keyof T] !== undefined && oldDocument[fieldName as keyof T] !== null);
    const isValid = (document[fieldName as keyof T] !== undefined && document[fieldName as keyof T] !== null);
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

export function addUniversalFields<T extends DbObject>({
  collection,
  schemaVersion = 1,
  createdAtOptions = {},
}: {
  collection: CollectionBase<T>,
  schemaVersion?: number
  createdAtOptions?: Partial<CollectionFieldPermissions>,
}): void {
  addFieldsDict(collection, {
    _id: {
      optional: true,
      type: String,
      canRead: ['guests'],
    },
    schemaVersion: {
      type: Number,
      canRead: ['guests'],
      optional: true,
      ...schemaDefaultValue(schemaVersion),
      onUpdate: () => schemaVersion
    },
    createdAt: {
      type: Date,
      optional: true,
      hidden: true,
      canRead: ['guests'],
      onInsert: () => new Date(),
      ...createdAtOptions,
    },
    legacyData: {
      type: Object,
      optional: true,
      nullable: true,
      blackbox: true,
      hidden: true,
      canRead: ['admins'],
      canCreate: ['admins'],
      canUpdate: ['admins'],
    },
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
