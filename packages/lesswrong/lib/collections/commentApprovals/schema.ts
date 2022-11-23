import { foreignKeyField } from '../../utils/schemaUtils'
import { userOwns } from '../../vulcan-users/permissions';

const schema: SchemaType<DbCommentApproval> = {
  commentId: {
    ...foreignKeyField({
      idFieldName: "commentId",
      resolverName: "comment",
      collectionName: "Comments",
      type: "Comment",
      nullable: false
    }),
    // TODO: figure out all permissions
    canRead: ['guests'],
    canCreate: ['members', 'sunshineRegiment', 'admins'],
    optional: true,
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: false,
    }),
    canRead: ['guests'],
    canCreate: ['members', 'sunshineRegiment', 'admins'],
    optional: true,
  },
  status: {
    type: String,
    allowedValues: ['approved', 'rejected'],
    // TODO: figure out all permissions
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members', 'sunshineRegiment', 'admins'],
  },
  rejectionReason: {
    type: String,
    nullable: true,
    optional: true,
    // TODO: figure out all permissions
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members', 'sunshineRegiment', 'admins'],    
  }
};

export default schema;
