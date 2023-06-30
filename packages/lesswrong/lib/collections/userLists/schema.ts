import { arrayOfForeignKeysField, foreignKeyField } from '../../utils/schemaUtils';
import { schemaDefaultValue } from '../../collectionUtils'
import { documentIsNotDeleted, userOwns } from '../../vulcan-users';

const schema: SchemaType<DbUserList> = {
  name: {
    type: String,
    canRead: ['guests'],
    canUpdate: [userOwns],
    canCreate: ['members'],
  },
  
  deleted: {
    type: Boolean,
    canRead: ['guests'],
    canUpdate: [userOwns],
    canCreate: ['members'],
    optional: true,
    ...schemaDefaultValue(false),
  },
  isPublic: {
    type: Boolean,
    canRead: ['guests'],
    canUpdate: [userOwns],
    canCreate: ['members'],
    optional: true,
    ...schemaDefaultValue(false),
  },

  memberIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "memberIds",
      resolverName: "members",
      collectionName: "Users",
      type: "User"
    }),
    control: "FormUsersListEditor",
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
    }),
    canRead: ['guests'],
    canCreate: ['members'],
    optional: true,
    hidden: true,
  }
};

export default schema;
