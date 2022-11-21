import { foreignKeyField } from '../../utils/schemaUtils'
import { userOwns } from '../../vulcan-users/permissions';

// export const DOWNVOTED_COMMENT_ALERT = 'downvotedCommentAlert';

// export const COMMENT_MODERATOR_ACTION_TYPES = {
//   [DOWNVOTED_COMMENT_ALERT]: 'Downvoted Comment'
// };

// /**
//  * If the action hasn't ended yet (either no endedAt, or endedAt in the future), it's active.
//  */
// export const isCommentActionActive = (moderatorAction: DbCommentModeratorAction) => {
//   return !moderatorAction.endedAt || moderatorAction.endedAt > new Date();
// }

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
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    optional: true,
  },
  status: {
    type: String,
    // control: 'select',
    allowedValues: ['approved', 'rejected'],
    // options: () => Object.entries(COMMENT_MODERATOR_ACTION_TYPES).map(([value, label]) => ({ value, label })),
    // TODO: figure out all permissions
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
  },
  rejectionReason: {
    type: String,
    nullable: true,
    optional: true,
    // TODO: figure out all permissions
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],    
  }
  // endedAt: {
  //   type: Date,
  //   optional: true,
  //   nullable: true,
  //   canRead: [userOwns, 'sunshineRegiment', 'admins'],
  //   canUpdate: ['sunshineRegiment', 'admins'],
  //   canCreate: ['sunshineRegiment', 'admins'],
  //   control: 'datetime',
  // },
  // active: resolverOnlyField({
  //   type: Boolean,
  //   canRead: [userOwns, 'sunshineRegiment', 'admins'],
  //   resolver: (doc) => isCommentActionActive(doc)
  // })
};

export default schema;
