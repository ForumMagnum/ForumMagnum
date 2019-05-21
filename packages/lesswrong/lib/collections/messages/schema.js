import { foreignKeyField } from '../../modules/utils/schemaUtils'
import Users from 'meteor/vulcan:users';

const schema = {
  _id: {
    type: String,
    viewableBy: ['guests'],
    optional: true,
  },
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
