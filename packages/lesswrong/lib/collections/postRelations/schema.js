import { foreignKeyField } from '../../modules/utils/schemaUtils'

const schema = {
  _id: {
    type: String,
    viewableBy: ['guests'],
  },
  createdAt: {
    type: Date,
    optional: true,
    onInsert: (document, currentUser) => new Date(),
    viewableBy: ['members'],
  },
  type: {
    // "subQuestion"
    type: String,
    optional: true,
    viewableBy: ['members'],
    insertableBy: ['members'],
    editableBy: ['members'],
  },
  sourcePostId: {
    ...foreignKeyField({
      idFieldName: "sourcePostId",
      resolverName: "sourcePost",
      collectionName: "Posts",
      type: "Post",
    }),
    viewableBy: ['members'],
    insertableBy: ['members'],
  },
  targetPostId: {
    ...foreignKeyField({
      idFieldName: "targetPostId",
      resolverName: "targetPost",
      collectionName: "Posts",
      type: "Post",
    }),
    viewableBy: ['members'],
    insertableBy: ['members'],
  },
  order: {
    type: Number,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
  }
};

export default schema;
