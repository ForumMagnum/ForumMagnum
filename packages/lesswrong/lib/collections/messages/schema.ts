import { foreignKeyField } from '../../utils/schemaUtils'
import { schemaDefaultValue } from '../../collectionUtils'

const schema: SchemaType<DbMessage> = {
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
