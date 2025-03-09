import { foreignKeyField, schemaDefaultValue } from '../../utils/schemaUtils'
import { universalFields } from '@/lib/collectionUtils';
import { subscriptionTypes } from './helpers';

const schema: SchemaType<"Subscriptions"> = {
  ...universalFields({}),

  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: false,
    }),
    onCreate: ({currentUser}) => currentUser!._id,
    canRead: ['members'],
    optional: true,
    nullable: false,
  },
  state: {
    type: String,
    nullable: false,
    allowedValues: ['subscribed', 'suppressed'],
    canCreate: ['members'],
    canRead: ['members'],
  },
  documentId: {
    type: String,
    canRead: ['members'],
    canCreate: ['members']
  },
  collectionName: {
    type: String,
    nullable: false,
    typescriptType: "CollectionNameString",
    canRead: ['members'],
    canCreate: ['members']
  },
  deleted: {
    type: Boolean,
    canRead: ['members'],
    ...schemaDefaultValue(false),
    optional: true
  },
  type: {
    type: String,
    nullable: false,
    allowedValues: Object.values(subscriptionTypes),
    canCreate: ['members'],
    canRead: ['members'],
  }
};

export default schema;
