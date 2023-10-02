import { foreignKeyField, resolverOnlyField } from '../../utils/schemaUtils'
import { userOwns } from '../../vulcan-users/permissions';

export const DOWNVOTED_COMMENT_ALERT = 'downvotedCommentAlert';

export const COMMENT_MODERATOR_ACTION_TYPES = {
  [DOWNVOTED_COMMENT_ALERT]: 'Downvoted Comment'
};

/**
 * If the action hasn't ended yet (either no endedAt, or endedAt in the future), it's active.
 */
export const isCommentActionActive = (moderatorAction: Pick<DbCommentModeratorAction, 'endedAt'>) => {
  return !moderatorAction.endedAt || moderatorAction.endedAt > new Date();
}

const schema: SchemaType<DbCommentModeratorAction> = {
  commentId: {
    ...foreignKeyField({
      idFieldName: "commentId",
      resolverName: "comment",
      collectionName: "Comments",
      type: "Comment",
      nullable: false
    }),
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    optional: true,
  },
  type: {
    type: String,
    control: 'select',
    allowedValues: Object.keys(COMMENT_MODERATOR_ACTION_TYPES),
    options: () => Object.entries(COMMENT_MODERATOR_ACTION_TYPES).map(([value, label]) => ({ value, label })),
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
  },
  endedAt: {
    type: Date,
    optional: true,
    nullable: true,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    control: 'datetime',
  },
  active: resolverOnlyField<DbCommentModeratorAction, ['endedAt']>({
    type: Boolean,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    dependsOn: ['endedAt'],
    resolver: (doc) => isCommentActionActive(doc)
  })
};

export default schema;
