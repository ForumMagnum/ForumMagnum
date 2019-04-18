import { foreignKeyField } from '../../modules/utils/schemaUtils'

const schema = {
  _id: {
    optional: true,
    type: String,
    viewableBy: ['guests'],
  },
  createdAt: {
    type: Date,
    optional: true,
    onInsert: (document, currentUser) => new Date(),
    viewableBy: ['members'],
  },
  parentPostId: {
    ...foreignKeyField({
      idFieldName: "parentPostId",
      resolverName: "parentPost",
      collectionName: "Posts",
      type: "Post",
    }),
    viewableBy: ['members'],
    insertableBy: ['members'],
    optional: true,
  },
  childPostId: {
    ...foreignKeyField({
      idFieldName: "childPostId",
      resolverName: "childPost",
      collectionName: "Posts",
      type: "Post",
    }),
    viewableBy: ['members'],
    insertableBy: ['members'],
    optional: true,
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
