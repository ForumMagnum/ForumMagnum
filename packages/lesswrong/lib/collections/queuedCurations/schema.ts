import { schemaDefaultValue } from '../../collectionUtils';
import { foreignKeyField } from '../../utils/schemaUtils'
import { userOwns } from '../../vulcan-users/permissions';

const schema: SchemaType<DbQueuedCuration> = {
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: false,
    }),
    canRead: [userOwns, 'admins'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'admins'],
  },
  postId: {
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
      nullable: false,
    }),
    canRead: [userOwns, 'admins'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'admins'],
  },
  publishedCurationCommentId: {
    ...foreignKeyField({
      idFieldName: "commentId",
      resolverName: "publishedCurationComment",
      collectionName: "Comments",
      type: "Comment",
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
