import { foreignKeyField } from '../../utils/schemaUtils';

const schema = {
  _id: {
    optional: true,
    type: String,
    viewableBy: ['members'],
  },
  createdAt: {
    optional: true,
    type: Date,
    viewableBy: ['members'],
    onInsert: (document) => new Date(),
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
    }),
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    hidden: true,
  },
  ckCommentId: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    hidden: true,
  },
  ckContent: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    hidden: true,
  },
  ckThreadId: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    hidden: true,
  },
  deleted: {
    type: Boolean,
  }
}

export default schema; 