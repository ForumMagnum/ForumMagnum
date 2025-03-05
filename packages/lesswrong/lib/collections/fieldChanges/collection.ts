import { foreignKeyField } from '@/lib/utils/schemaUtils';
import { createCollection } from '../../vulcan-lib/collections';
import { addUniversalFields } from '@/lib/collectionUtils';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

const schema: SchemaType<"FieldChanges"> = {
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
    typescriptType: 'Json',
    blackbox: true,
    canRead: ['members'],
  },
  newValue: {
    type: Object,
    typescriptType: 'Json',
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

addUniversalFields({ collection: FieldChanges, });
