import { foreignKeyField } from '../../../lib/modules/utils/schemaUtils';

const schema = {
  _id: {
    type: String,
  },
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
  used: {
    type: Boolean,
  },
  params: {
    type: Object,
    blackbox: true,
  },
}

export default schema;
