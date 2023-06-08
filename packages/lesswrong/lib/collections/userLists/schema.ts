import { arrayOfForeignKeysField, foreignKeyField } from '../../utils/schemaUtils';
import { documentIsNotDeleted, userOwns } from '../../vulcan-users';

const schema: SchemaType<DbUserList> = {
  name: {
    type: String,
    canRead: ['guests'],
    canUpdate: [userOwns],
    canCreate: ['members'],
  },

  memberIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "memberIds",
      resolverName: "members",
      collectionName: "Users",
      type: "User"
    }),
    control: "UsersListEditor",
    canRead: ['guests'],
    canUpdate: [userOwns],
    canCreate: ['members'],
  },

  'memberIds.$': {
    type: String,
    optional: true,
  },

  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    canRead: ['guests'],
    canCreate: ['members'],
    optional: true,
    hidden: true,
  }
};

export default schema;
