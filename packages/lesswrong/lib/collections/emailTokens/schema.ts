import { foreignKeyField } from '../../../lib/utils/schemaUtils';

const schema = {
  token: {
    type: String,
  },
  tokenType: {
    type: String,
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
    })
  },
  usedAt: {
    type: Date,
    optional: true,
  },
  params: {
    type: Object,
    blackbox: true,
  },
}

export default schema;
