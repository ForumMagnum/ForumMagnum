import { foreignKeyField } from '@/lib/utils/schemaUtils';
import { universalFields } from '@/lib/collectionUtils';

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

export default schema;
