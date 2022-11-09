import { foreignKeyField } from '../../utils/schemaUtils'

const schema: SchemaType<DbLWEvent> = {
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    viewableBy: ['members'],
    insertableBy: ['members'],
    optional: true,
  },
  name: {
    type: String,
    viewableBy: ['members'],
    insertableBy: ['members'],
  },
  documentId: {
    type: String,
    // No explicit foreign-key relationship because documentId refers to different collections based on event type
    optional: true,
    viewableBy: ['members'],
    insertableBy: ['members'],
  },
  important: { // marking an event as important means it should never be erased
    type: Boolean,
    optional: true,
    viewableBy: ['members'],
    insertableBy: ['members'],
    editableBy: ['admins']
  },
  properties: {
    type: Object,
    optional: true,
    blackbox: true,
    viewableBy: ['members'],
    insertableBy: ['members'],
  },
  intercom: { // whether to send this event to intercom or not
    type: Boolean,
    optional: true,
    viewableBy: ['members'],
    insertableBy: ['members'],
  }
};

export default schema;
