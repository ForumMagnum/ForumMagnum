import { schemaDefaultValue } from '../../collectionUtils'
import { userOwns } from '../../vulcan-users/permissions';
import GraphQLJSON from 'graphql-type-json';
import { foreignKeyField } from '../../utils/schemaUtils';


const schema: SchemaType<DbPoll> = {
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
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
    }),
    canRead: ['guests'],
    canCreate: ['members'],
    hidden: true,
  },
  contents: {
    type: GraphQLJSON,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'admins', 'sunshineRegiment'],
    
  },
  question: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'admins', 'sunshineRegiment'],
  }
};

export type PollContents = {
  type: "MultipleChoice",
  value: {
    options: string[]
  }
}

export default schema
