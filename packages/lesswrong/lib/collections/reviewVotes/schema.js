import { foreignKeyField } from '../../modules/utils/schemaUtils'
import { schemaDefaultValue } from '../../collectionUtils';

import SimpleSchema from 'simpl-schema'

const schema = {
  _id: {
    type: String,
    viewableBy: ['guests'],
    optional: true
  },
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
    insertableBy: ['members'],
  },
  qualitativeScore: {
    type: SimpleSchema.Integer, 
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    optional: true,
    ...schemaDefaultValue(1)
  },
  quadraticScore: {
    type: SimpleSchema.Integer, 
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    optional: true,
    ...schemaDefaultValue(0)
  },
};

export default schema;
