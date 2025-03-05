import { schemaDefaultValue, foreignKeyField } from '../../utils/schemaUtils'
import SimpleSchema from 'simpl-schema'
import { universalFields } from '../../collectionUtils';

export const DEFAULT_QUALITATIVE_VOTE = 4

const schema: SchemaType<"ReviewVotes"> = {
  ...universalFields({}),
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    onCreate: ({currentUser}) => currentUser!._id,
    canRead: ['guests'],
    optional: true,
    nullable: false,
  },
  postId: {
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
      nullable: true,
    }),
    canRead: ['guests'],
    nullable: false,
  },
  qualitativeScore: {
    type: SimpleSchema.Integer, 
    canRead: ['guests'],
    optional: true,
    ...schemaDefaultValue(DEFAULT_QUALITATIVE_VOTE)
  },
  quadraticScore: {
    type: SimpleSchema.Integer, 
    canRead: ['guests'],
    optional: true,
    ...schemaDefaultValue(0)
  },
  comment: {
    type: String,
    canRead: ['guests'],
    optional: true
  },
  year: {
    type: String,
    canRead: ['guests'],
    ...schemaDefaultValue("2018")
  },
  dummy: {
    type: Boolean,
    canRead: ['guests'],
    ...schemaDefaultValue(false)
  },
  reactions: {
    type: Array,
    canRead: ['guests'],
  },
  'reactions.$': {
    type: String,
    optional: true
  },
};

export default schema;
