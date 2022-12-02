import { foreignKeyField } from '../../utils/schemaUtils'
import { schemaDefaultValue } from '../../collectionUtils';
import { userOwns } from '../../vulcan-users/permissions';

const schema: SchemaType<DbAdvisorRequest> = {
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    hidden: true,
    insertableBy: ['members', 'admins'],
    viewableBy: [userOwns, 'admins'],
    editableBy: [userOwns, 'admins'],
  },
  interestedInMetaculus: {
    type: Boolean,
    optional: true,
    hidden: true,
    insertableBy: ['members', 'admins'],
    viewableBy: [userOwns, 'admins'],
    editableBy: [userOwns, 'admins'],
    ...schemaDefaultValue(false),
  },
};

export default schema;
