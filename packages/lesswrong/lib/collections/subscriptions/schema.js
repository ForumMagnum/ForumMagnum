import Users from 'meteor/vulcan:users'
import { foreignKeyField, schemaDefaultValue } from '../../modules/utils/schemaUtils'

export const subscriptionTypes = ['newComments', 'newPosts', 'newRelatedQuestions', 'newEvent']

const schema = {
  _id: {
    optional: true,
    type: String,
    canRead: [Users.owns],
  },
  createdAt: {
    type: Date,
    optional: true,
    canRead: [Users.owns],
    onCreate: () => new Date(),
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
    }),
    canRead: [Users.owns],
    optional: true,
    hidden: true,
  },
  state: {
    type: String,
    allowedValues: ['subscribed', 'suppressed'],
    canCreate: ['members'],
    canRead: [Users.owns],
  },
  documentId: {
    type: String,
    canRead: [Users.owns],
    canCreate: ['members']
  },
  collectionName: {
    type: String, 
    canRead: [Users.owns],
    canCreate: ['members']
  },
  deleted: {
    type: Boolean,
    canRead: [Users.owns],
    ...schemaDefaultValue(false),
  },
  type: {
    type: String,
    allowedValues: subscriptionTypes,
    canCreate: ['members'],
    canRead: [Users.owns]
  }
};

export default schema;
