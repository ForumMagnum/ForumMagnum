import * as _ from 'underscore';
import { schemaDefaultValue } from './utils/schemaUtils';

declare module "simpl-schema" {
  interface SchemaDefinition {
    canAutofillDefault?: boolean
    denormalized?: boolean
    foreignKey?: CollectionNameString | {collection: CollectionNameString,field: string}
    nullable?: boolean
  }
}

export function universalFields({
  schemaVersion = 1,
  createdAtOptions = {},
  legacyDataOptions = {},
}: {
  schemaVersion?: number
  createdAtOptions?: Partial<CollectionFieldPermissions>,
  legacyDataOptions?: Partial<CollectionFieldPermissions>,
}) {
  const universalFields: Record<string, CollectionFieldSpecification<CollectionNameString>> = {
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
  };

  return universalFields;
}

export function isUniversalField(fieldName: string): boolean {
  return fieldName==="_id" || fieldName==="schemaVersion";
}
