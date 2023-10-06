import { userOwns } from '../../vulcan-users/permissions';
import { foreignKeyField } from '../../utils/schemaUtils'
import { schemaDefaultValue } from '../../collectionUtils'

export const subscriptionTypes = {
  newComments: 'newComments',
  newShortform: 'newShortform',
  newPosts: 'newPosts',
  newRelatedQuestions: 'newRelatedQuestions',
  newEvents: 'newEvents',
  newReplies: 'newReplies',
  newTagPosts: 'newTagPosts',
  newDialogueMessages: 'newDialogueMessages',
  newPublishedDialogueMessages: 'newPublishedDialogueMessages',
  newDebateComments: 'newDebateComments'
} as const

export type SubscriptionType = typeof subscriptionTypes[keyof typeof subscriptionTypes];

const schema: SchemaType<DbSubscription> = {
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: false,
    }),
    onCreate: ({currentUser}) => currentUser!._id,
    canRead: [userOwns],
    optional: true,
  },
  state: {
    type: String,
    allowedValues: ['subscribed', 'suppressed'],
    canCreate: ['members'],
    canRead: [userOwns],
  },
  documentId: {
    type: String,
    canRead: [userOwns],
    canCreate: ['members']
  },
  collectionName: {
    type: String, 
    typescriptType: "CollectionNameString",
    canRead: [userOwns],
    canCreate: ['members']
  },
  deleted: {
    type: Boolean,
    canRead: [userOwns],
    ...schemaDefaultValue(false),
    optional: true
  },
  type: {
    type: String,
    allowedValues: Object.values(subscriptionTypes),
    canCreate: ['members'],
    canRead: [userOwns]
  }
};

export default schema;
