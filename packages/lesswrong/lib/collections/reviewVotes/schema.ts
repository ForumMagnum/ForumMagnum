import { foreignKeyField } from '../../utils/schemaUtils'
import { schemaDefaultValue } from '../../collectionUtils';

import SimpleSchema from 'simpl-schema'

export const DEFAULT_QUALITATIVE_VOTE = 4

const schema: SchemaType<DbReviewVote> = {
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    onCreate: ({currentUser}) => currentUser!._id,
    viewableBy: ['guests'],
    optional: true
  },
  postId: {
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
      nullable: true,
    }),
    viewableBy: ['guests'],
  },
  qualitativeScore: {
    type: SimpleSchema.Integer, 
    viewableBy: ['guests'],
    optional: true,
    ...schemaDefaultValue(DEFAULT_QUALITATIVE_VOTE)
  },
  quadraticScore: {
    type: SimpleSchema.Integer, 
    viewableBy: ['guests'],
    optional: true,
    ...schemaDefaultValue(0)
  },
  comment: {
    type: String,
    viewableBy: ['guests'],
    optional: true
  },
  year: {
    type: String,
    viewableBy: ['guests'],
    ...schemaDefaultValue("2018")
  },
  dummy: {
    type: Boolean,
    viewableBy: ['guests'],
    ...schemaDefaultValue(false)
  },
  reactions: {
    type: Array,
    viewableBy: ['guests'],
  },
  'reactions.$': {
    type: String,
    optional: true
  },
};

export default schema;
