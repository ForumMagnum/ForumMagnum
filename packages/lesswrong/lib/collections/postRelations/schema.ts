import { foreignKeyField } from '../../utils/schemaUtils'
import { universalFields } from '../../collectionUtils';

const schema: SchemaType<"PostRelations"> = {
  ...universalFields({}),
  type: {
    // "subQuestion"
    type: String,
    optional: true,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
  },
  sourcePostId: {
    ...foreignKeyField({
      idFieldName: "sourcePostId",
      resolverName: "sourcePost",
      collectionName: "Posts",
      type: "Post",
      nullable: true
    }),
    nullable: false,
    canRead: ['guests'],
    canCreate: ['members'],
  },
  targetPostId: {
    ...foreignKeyField({
      idFieldName: "targetPostId",
      resolverName: "targetPost",
      collectionName: "Posts",
      type: "Post",
      nullable: true
    }),
    nullable: false,
    canRead: ['guests'],
    canCreate: ['members'],
  },
  order: {
    type: Number,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
  }
};

export default schema;
