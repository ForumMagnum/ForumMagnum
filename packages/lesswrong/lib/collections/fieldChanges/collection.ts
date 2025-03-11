import { foreignKeyField } from '@/lib/utils/schemaUtils';
import { createCollection } from '../../vulcan-lib/collections';
import { universalFields } from '@/lib/collectionUtils';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

const schema: SchemaType<"FieldChanges"> = {
  ...universalFields({}),
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    canRead: ['members'],
    optional: true,
  },
  changeGroup: {
    type: String,
    canRead: ['members'],
  },
  documentId: {
    type: String,
    canRead: ['members'],
  },
  fieldName: {
    type: String,
    canRead: ['members'],
  },
  
  // While these are both JSON values, they can also contain primitives like strings, numbers, booleans, nulls, etc.
  // They should still get deserialized correctly.
  oldValue: {
    type: Object,
    blackbox: true,
    canRead: ['members'],
  },
  newValue: {
    type: Object,
    blackbox: true,
    canRead: ['members'],
  },
};

export const FieldChanges = createCollection({
  collectionName: "FieldChanges",
  typeName: "FieldChange",
  schema,
  logChanges: false,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('FieldChanges', { documentId: 1, createdAt: 1 })
    indexSet.addIndex('FieldChanges', { userId: 1, createdAt: 1 })
    return indexSet;
  },
});
