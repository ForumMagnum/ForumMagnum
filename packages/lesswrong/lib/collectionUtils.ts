import * as _ from 'underscore';
import { addFieldsDict, schemaDefaultValue } from './utils/schemaUtils';
export { getDefaultMutations } from './vulcan-core/default_mutations';
export { getDefaultResolvers } from './vulcan-core/default_resolvers';

declare module "simpl-schema" {
  interface SchemaDefinition {
    canAutofillDefault?: boolean
    denormalized?: boolean
    foreignKey?: CollectionNameString | {collection: CollectionNameString,field: string}
    nullable?: boolean
  }
}

export function addUniversalFields<N extends CollectionNameString>({
  collection,
  schemaVersion = 1,
  createdAtOptions = {},
  legacyDataOptions = {},
}: {
  collection: CollectionBase<N>,
  schemaVersion?: number
  createdAtOptions?: Partial<CollectionFieldPermissions>,
  legacyDataOptions?: Partial<CollectionFieldPermissions>,
}): void {
  addFieldsDict(collection, {
    _id: {
      optional: true,
      nullable: false,
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
      nullable: false,
      hidden: true,
      canRead: ['guests'],
      onCreate: () => new Date(),
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
      ...legacyDataOptions,
    },
  })
}

export function isUniversalField(fieldName: string): boolean {
  return fieldName==="_id" || fieldName==="schemaVersion";
}

export function isUnbackedCollection<N extends CollectionNameString>(
  collection: CollectionBase<N>,
): boolean {
  const collectionName: string = collection.collectionName;
  if (collectionName === 'Settings' || collectionName === 'Callbacks') {
    // Vulcan collections with no backing database table
    return true;
  }
  
  return false;
}
