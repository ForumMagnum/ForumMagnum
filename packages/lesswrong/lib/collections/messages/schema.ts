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
    viewableBy: ['members'],
    insertableBy: ['admins'],
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
    viewableBy: ['members'],
    insertableBy: ['members'],
    hidden: true,
  },
  noEmail: {
    optional: true,
    type: Boolean,
    viewableBy: ['admins'],
    insertableBy: ['admins'],
    ...schemaDefaultValue(false)
  },
};

export default schema;
