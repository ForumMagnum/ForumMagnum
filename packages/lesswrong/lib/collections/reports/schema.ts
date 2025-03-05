import { foreignKeyField } from '../../utils/schemaUtils'
import { addUniversalFields } from '../../collectionUtils'

const schema: SchemaType<"Reports"> = {
  ...addUniversalFields({
    createdAtOptions: {
      canRead: ['guests'],
      canUpdate: ['admins'],
    },
  }),
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: false,
    }),
    canRead: ['guests'],
    canCreate: ['members'],
    hidden: true,
    optional: true,
    nullable: false
  },
  reportedUserId: {
    ...foreignKeyField({
      idFieldName: "reportedUserId",
      resolverName: "reportedUser",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    canRead: ['guests'],
    canCreate: ['members'],
    hidden: true,
    optional: true,
  },
  commentId: {
    ...foreignKeyField({
      idFieldName: "commentId",
      resolverName: "comment",
      collectionName: "Comments",
      type: "Comment",
      nullable: true,
    }),
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    hidden: true,
  },
  postId: {
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
      nullable: true,
    }),
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    hidden: true,
  },
  link: {
    type: String,
    optional: false,
    canCreate: ['members'],
    canRead: ['guests'],
    hidden: true,
  },
  claimedUserId: {
    ...foreignKeyField({
      idFieldName: "claimedUserId",
      resolverName: "claimedUser",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    optional: true,
    canRead: ['guests'],
    hidden: true,
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
  },
  description: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['members'],
    canCreate: ['members'],
    label: "Reason",
    placeholder: "What are you reporting this comment for?",
  },
  closedAt: {
    optional: true,
    nullable: true,
    type: Date,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
  },
  // Only set when report is closed. Indicates whether content is spam or not.
  markedAsSpam: {
    optional: true,
    type: Boolean,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
  },
  // Set when report is created, indicates whether content was reported as spam
  // (currently only used for Akismet integration)
  reportedAsSpam: {
    optional: true,
    hidden: true,
    type: Boolean,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['members']
  }
};

export default schema;
