import { foreignKeyField } from '../../utils/schemaUtils'

const schema: SchemaType<DbPostRelation> = {
  type: {
    // "subQuestion"
    type: String,
    optional: true,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
  },
  sourcePostId: {
    ...foreignKeyField({
      idFieldName: "sourcePostId",
      resolverName: "sourcePost",
      collectionName: "Posts",
      type: "Post",
      nullable: true
    }),
    viewableBy: ['guests'],
    insertableBy: ['members'],
  },
  targetPostId: {
    ...foreignKeyField({
      idFieldName: "targetPostId",
      resolverName: "targetPost",
      collectionName: "Posts",
      type: "Post",
      nullable: true
    }),
    viewableBy: ['guests'],
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
