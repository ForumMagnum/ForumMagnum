import Users from '../users/collection'
import { foreignKeyField, SchemaType } from '../../utils/schemaUtils'
import { schemaDefaultValue } from '../../collectionUtils'

export const subscriptionTypes = {
  newComments: 'newComments',
  newShortform: 'newShortform',
  newPosts: 'newPosts',
  newRelatedQuestions: 'newRelatedQuestions',
  newEvents: 'newEvents',
  newReplies: 'newReplies',
  newTagPosts: 'newTagPosts'
}

const schema: SchemaType<DbSubscription> = {
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
    onCreate: ({currentUser}) => currentUser._id,
    canRead: [Users.owns],
    optional: true,
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
    optional: true
  },
  type: {
    type: String,
    allowedValues: Object.values(subscriptionTypes),
    canCreate: ['members'],
    canRead: [Users.owns]
  }
};

export default schema;
