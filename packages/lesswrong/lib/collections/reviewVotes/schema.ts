import { foreignKeyField, SchemaType } from '../../utils/schemaUtils'
import { schemaDefaultValue } from '../../collectionUtils';

import SimpleSchema from 'simpl-schema'

const schema: SchemaType<DbReviewVote> = {
  createdAt: {
    type: Date,
    optional: true,
    viewableBy: ['guests'],
    onCreate: () => new Date(),
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User"
    }),
    onCreate: ({currentUser}) => currentUser._id,
    viewableBy: ['guests'],
    optional: true
  },
  postId: {
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
    }),
    viewableBy: ['guests'],
  },
  qualitativeScore: {
    type: SimpleSchema.Integer, 
    viewableBy: ['guests'],
    optional: true,
    ...schemaDefaultValue(1)
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
  }
};

export default schema;
