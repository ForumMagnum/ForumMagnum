import { foreignKeyField } from '../../utils/schemaUtils'

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
    insertableBy: ['members'],
    optional: true,
    hidden: true,
  },
  createdAt: {
    optional: true,
    type: Date,
    viewableBy: ['members'],
    onInsert: (document, currentUser) => new Date(),
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
  }
};

export default schema;
