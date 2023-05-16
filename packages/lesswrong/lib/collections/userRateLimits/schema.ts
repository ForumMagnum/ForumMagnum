import { foreignKeyField, resolverOnlyField } from '../../utils/schemaUtils'

/**
 * If the action hasn't ended yet (either no endedAt, or endedAt in the future), it's active.
 */
const isRateLimitActive = (userRateLimit: DbUserRateLimit) => {
  return !userRateLimit.endedAt || userRateLimit.endedAt > new Date();
}

const schema: SchemaType<DbUserRateLimit> = {
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
    }),
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    optional: false,
    nullable: false,
    control: 'SearchSingleUser'
  },
  type: {
    type: String,
    control: 'select',
    allowedValues: ['allComments', 'allPosts'],
    // options: () => Object.entries(MODERATOR_ACTION_TYPES).map(([value, label]) => ({ value, label })),
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    optional: false,
    nullable: false,
  },
  intervalMs: {
    type: Number,
    // control: TODO - maybe all the configuration just goes in a custom control?,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    optional: false,
    nullable: false,
  },
  actionsPerInterval: {
    type: Number,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    optional: false,
    nullable: false,
  },
  endedAt: {
    type: Date,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    optional: true,
    nullable: true,
    control: 'datetime',
  },
  active: resolverOnlyField({
    type: Boolean,
    canRead: ['guests'],
    resolver: (doc) => isRateLimitActive(doc)
  })
};

export default schema;
