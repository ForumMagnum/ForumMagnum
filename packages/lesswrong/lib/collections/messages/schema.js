import { foreignKeyField } from '../../utils/schemaUtils'
import Users from '../users/collection';

const schema = {
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
    }),
    viewableBy: ['members'],
    insertableBy: Users.owns,
    optional: true,
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
    }),
    viewableBy: ['members'],
    insertableBy: ['members'],
    hidden: true,
  }
};

export default schema;
