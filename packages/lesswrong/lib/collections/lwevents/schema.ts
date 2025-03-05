import { addUniversalFields } from '@/lib/collectionUtils';
import { foreignKeyField } from '../../utils/schemaUtils'

const schema: SchemaType<"LWEvents"> = {
  ...addUniversalFields({
    createdAtOptions: {canRead: ['members']},
  }),

  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    canRead: ['members'],
    canCreate: ['members'],
    optional: true,
  },
  name: {
    type: String,
    canRead: ['members'],
    canCreate: ['members'],
  },
  documentId: {
    type: String,
    // No explicit foreign-key relationship because documentId refers to different collections based on event type
    optional: true,
    canRead: ['members'],
    canCreate: ['members'],
  },
  important: { // marking an event as important means it should never be erased
    type: Boolean,
    optional: true,
    canRead: ['members'],
    canCreate: ['members'],
    canUpdate: ['admins']
  },
  properties: {
    type: Object,
    optional: true,
    blackbox: true,
    canRead: ['members'],
    canCreate: ['members'],
  },
  intercom: { // whether to send this event to intercom or not
    type: Boolean,
    optional: true,
    canRead: ['members'],
    canCreate: ['members'],
  }
};

export default schema;
