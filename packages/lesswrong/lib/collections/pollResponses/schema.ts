import { schemaDefaultValue } from '../../collectionUtils'
import { userOwns } from '../../vulcan-users/permissions';
import GraphQLJSON from 'graphql-type-json';
import { foreignKeyField } from '../../utils/schemaUtils';


const schema: SchemaType<DbPollResponse> = {
  createdAt: {
    optional: true,
    type: Date,
    canRead: ['guests'],
    onInsert: () => new Date(),
  },
  deleted: {
    optional: true,
    type: Boolean,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    order: 2,
    ...schemaDefaultValue(false),
  },
  pollId: {
    ...foreignKeyField({
      idFieldName: "pollId",
      resolverName: "poll",
      collectionName: "Polls",
      type: "Poll",
    }),
    canRead: ['guests'],
    canCreate: ['members'],
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
    }),
    canRead: [userOwns],
    canCreate: ['members'],
    hidden: true,
  },
  response: {
    type: GraphQLJSON,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'admins', 'sunshineRegiment'],
    
  },
};

export default schema
