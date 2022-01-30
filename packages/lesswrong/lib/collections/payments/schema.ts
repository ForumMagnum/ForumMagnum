import { foreignKeyField } from '../../utils/schemaUtils';
import { userOwns } from '../../vulcan-users/permissions';

const schema: SchemaType<DbPayment> = {
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true
    }),
    type: String,
    foreignKey: "Users",
    optional: true,
    viewableBy: [userOwns, 'admins'],
  },
  recipientUserId: {
    ...foreignKeyField({
      idFieldName: "recipientUserId",
      resolverName: "recipientUser",
      collectionName: "Users",
      type: "User",
    }),
    type: String,
    foreignKey: "Users",
    viewableBy: [userOwns, 'admins'],
  },
  createdAt: {
    optional: true,
    type: Date,
    viewableBy: [userOwns, 'admins'],
    onInsert: (document, currentUser) => new Date(),
  },
  amount: {
    type: Number,
    viewableBy: [userOwns, 'admins']
  },
  recipientContactEmail: {
    type: String,
    optional: true,
    viewableBy: [userOwns, 'admins']
  },
  recipientPaymentEmail: {
    type: String,
    optional: true,
    viewableBy: [userOwns, 'admins']
  },
  recipientPaymentInfo: {
    type: String,
    optional: true,
    viewableBy: [userOwns, 'admins']
  }
}

export default schema;
