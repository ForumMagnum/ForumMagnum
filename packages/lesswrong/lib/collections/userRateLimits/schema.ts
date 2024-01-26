import { foreignKeyField } from '../../utils/schemaUtils'

const dictionaryToSelectOptions = <T extends Record<string, string>>(dictionary: T) => {
  return Object.entries(dictionary).map(([value, label]) => ({ value, label }));
};

export const USER_RATE_LIMIT_TYPES = {
  allComments: 'Comments',
  allPosts: 'Posts'
};

const INTERVAL_UNITS = {
  minutes: 'minutes',
  hours: 'hours',
  days: 'days',
  weeks: 'weeks'
};

const schema: SchemaType<"UserRateLimits"> = {
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
    hidden: true
  },
  type: {
    type: String,
    control: 'select',
    allowedValues: Object.keys(USER_RATE_LIMIT_TYPES),
    options: () => dictionaryToSelectOptions(USER_RATE_LIMIT_TYPES),
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    optional: false,
    nullable: false,
  },
  intervalUnit: {
    type: String,
    control: 'select',
    allowedValues: Object.keys(INTERVAL_UNITS),
    options: () => dictionaryToSelectOptions(INTERVAL_UNITS),
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    optional: false,
    nullable: false,
  },
  intervalLength: {
    type: Number,
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
  }
};

export default schema;
