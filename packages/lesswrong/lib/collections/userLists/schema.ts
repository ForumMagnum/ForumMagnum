import { arrayOfForeignKeysField, foreignKeyField } from '../../utils/schemaUtils';
import { schemaDefaultValue } from '../../collectionUtils'
import { documentIsNotDeleted, userOwns } from '../../vulcan-users';

const schema: SchemaType<DbUserList> = {
  name: {
    type: String,
    canRead: ['guests'],
    canUpdate: [userOwns],
    canCreate: ['members'],
    order: 1,
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
    order: 3,
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
  },
  
  isPublic: {
    type: Boolean,
    canRead: ['guests'],
    canUpdate: [userOwns],
    canCreate: ['members'],
    optional: true,
    order: 4,
    ...schemaDefaultValue(false),
  },
  
  deleted: {
    type: Boolean,
    canRead: ['guests'],
    canUpdate: [userOwns],
    canCreate: ['members'],
    optional: true,
    hidden: true,
    ...schemaDefaultValue(false),
  },
};

export default schema;
