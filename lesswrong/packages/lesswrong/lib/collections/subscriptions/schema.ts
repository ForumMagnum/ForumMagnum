import { userOwns } from '../../vulcan-users/permissions';
import { foreignKeyField, schemaDefaultValue } from '../../utils/schemaUtils'

export const subscriptionTypes = {
  newComments: 'newComments',
  newUserComments: 'newUserComments',
  newShortform: 'newShortform',
  newPosts: 'newPosts',
  newRelatedQuestions: 'newRelatedQuestions',
  newEvents: 'newEvents',
  newReplies: 'newReplies',
  newTagPosts: 'newTagPosts',
  newSequencePosts: 'newSequencePosts',
  newDebateComments: 'newDebateComments',
  newDialogueMessages: 'newDialogueMessages',
  newPublishedDialogueMessages: 'newPublishedDialogueMessages',
  newActivityForFeed: 'newActivityForFeed', //unclear if this the best way to do this since this subscription isn't for triggering notifications
} as const

export type SubscriptionType = typeof subscriptionTypes[keyof typeof subscriptionTypes];

const schema: SchemaType<"Subscriptions"> = {
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: false,
    }),
    onCreate: ({currentUser}) => currentUser!._id,
    canRead: ['members'],
    optional: true,
    nullable: false,
  },
  state: {
    type: String,
    nullable: false,
    allowedValues: ['subscribed', 'suppressed'],
    canCreate: ['members'],
    canRead: ['members'],
  },
  documentId: {
    type: String,
    canRead: ['members'],
    canCreate: ['members']
  },
  collectionName: {
    type: String,
    nullable: false,
    typescriptType: "CollectionNameString",
    canRead: ['members'],
    canCreate: ['members']
  },
  deleted: {
    type: Boolean,
    canRead: ['members'],
    ...schemaDefaultValue(false),
    optional: true
  },
  type: {
    type: String,
    nullable: false,
    allowedValues: Object.values(subscriptionTypes),
    canCreate: ['members'],
    canRead: ['members'],
  }
};

export default schema;
