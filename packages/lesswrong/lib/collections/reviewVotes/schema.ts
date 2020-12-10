import { foreignKeyField } from '../../utils/schemaUtils'
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
  }
};

export default schema;
