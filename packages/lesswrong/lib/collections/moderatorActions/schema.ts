import { foreignKeyField, resolverOnlyField } from '../../utils/schemaUtils'
import { userOwns } from '../../vulcan-users/permissions';

export const RATE_LIMIT_ONE_PER_DAY = 'rateLimitOnePerDay';
export const RECENTLY_DOWNVOTED_CONTENT_ALERT = 'recentlyDownvotedContentAlert';
export const LOW_AVERAGE_KARMA_COMMENT_ALERT = 'lowAverageKarmaCommentAlert';
export const LOW_AVERAGE_KARMA_POST_ALERT = 'lowAverageKarmaPostAlert';
export const NEGATIVE_KARMA_USER_ALERT = 'negativeUserKarmaAlert';

export const MODERATOR_ACTION_TYPES = {
  [RATE_LIMIT_ONE_PER_DAY]: 'Rate Limit (one per day)',
  [RECENTLY_DOWNVOTED_CONTENT_ALERT]: 'Recently Downvoted Content',
  [LOW_AVERAGE_KARMA_COMMENT_ALERT]: 'Low Average Karma Comments',
  [LOW_AVERAGE_KARMA_POST_ALERT]: 'Low Average Karma Posts',
  [NEGATIVE_KARMA_USER_ALERT]: 'Negative Karma User'
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
