import { foreignKeyField, schemaDefaultValue } from '../../utils/schemaUtils'

const schema: SchemaType<"Messages"> = {
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true
    }),
    canRead: ['members'],
    canCreate: ['admins'],
    optional: true,
    nullable: false,
    hidden: true,
  },
  conversationId: {
    ...foreignKeyField({
      idFieldName: "conversationId",
      resolverName: "conversation",
      collectionName: "Conversations",
      type: "Conversation",
      nullable: false,
    }),
    canRead: ['members'],
    canCreate: ['members'],
    nullable: false,
    hidden: true,
  },
  noEmail: {
    optional: true,
    type: Boolean,
    canRead: ['admins'],
    canCreate: ['admins'],
    ...schemaDefaultValue(false)
  },
};

export default schema;
