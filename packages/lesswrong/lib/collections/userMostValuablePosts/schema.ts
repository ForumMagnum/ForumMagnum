import { foreignKeyField, schemaDefaultValue } from '../../utils/schemaUtils';
import { userOwns } from '../../vulcan-users/permissions';
import { universalFields } from '../../collectionUtils';

const schema: SchemaType<"UserMostValuablePosts"> = {
  ...universalFields({}),
  userId: {
    nullable: false,
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    canRead: [userOwns, 'admins'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'admins'],
  },
  postId: {
    nullable: false,
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
      nullable: true,
    }),
    canRead: [userOwns, 'admins'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'admins'],
  },
  deleted: {
    type: Boolean,
    canRead: [userOwns, 'admins'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'admins'],
    hidden: true,
    optional: true,
    ...schemaDefaultValue(false),
  },
};

export default schema;
