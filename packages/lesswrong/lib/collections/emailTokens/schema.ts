import { foreignKeyField } from '../../../lib/utils/schemaUtils';
import { addUniversalFields } from '../../collectionUtils';

const schema: SchemaType<"EmailTokens"> = {
  ...addUniversalFields({}),
  token: {
    type: String,
    nullable: false,
  },
  tokenType: {
    type: String,
    nullable: false,
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: false,
    }),
    nullable: false,
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
