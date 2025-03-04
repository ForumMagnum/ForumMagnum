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
  
  // HACK: oldValue and newValue are JSON-serialized values, annotated as type string, because our query-translator only handles jsonb fields correctly when their contents are objects (but this could be a different JSON type such as a number, bool or string)
  oldValue: {
    type: String,
    blackbox: true,
    canRead: ['members'],
  },
  newValue: {
    type: String,
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
