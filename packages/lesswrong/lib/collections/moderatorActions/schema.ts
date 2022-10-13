import { foreignKeyField, resolverOnlyField } from '../../utils/schemaUtils'
import { userOwns } from '../../vulcan-users/permissions';

// const MODERATOR_ACTION_TYPES = ['rateLimit', 'commentQualityWarning'];

const MODERATOR_ACTION_TYPES = {
  rateLimitOnePerDay: 'Rate Limit (one per day)',
  commentQualityWarning: 'Comment Quality Warning'
};

/**
 * If the action hasn't ended yet (either no endedAt, or endedAt in the future), it's active.
 */
export const isActionActive = (moderatorAction: DbModeratorAction) => {
  return !moderatorAction.endedAt || moderatorAction.endedAt > new Date();
}

const schema: SchemaType<DbModeratorAction> = {
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
    }),
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    optional: true,
    control: 'SearchSingleUser'
    // hidden: true,
  },
  type: {
    type: String,
    control: 'select',
    allowedValues: Object.keys(MODERATOR_ACTION_TYPES),
    options: () => Object.entries(MODERATOR_ACTION_TYPES).map(([value, label]) => ({ value, label })),
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
  active: resolverOnlyField({
    type: Boolean,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    resolver: (doc) => isActionActive(doc)
  })
  // TODO: createdBy(?)
};

export default schema;
