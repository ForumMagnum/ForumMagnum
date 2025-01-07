import { foreignKeyField } from '../../utils/schemaUtils'
import { userOwns } from '../../vulcan-users/permissions';

/**
 * This collection is currently just used for targeting job ads on EAF.
 * Values are currently only changed via /scripts/importEAGUserInterests.
 */
const schema: SchemaType<"UserEAGDetails"> = {
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
    }),
    optional: false,
    nullable: false,
    hidden: true,
    canRead: [userOwns, 'admins'],
  },
  careerStage: {
    type: Array,
    optional: true,
    nullable: true,
    hidden: true,
    canRead: [userOwns, 'admins'],
    canUpdate: [userOwns, 'admins'],
  },
  'careerStage.$': {
    type: String,
    optional: true,
  },
  countryOrRegion: {
    type: String,
    optional: true,
    nullable: true,
    hidden: true,
    canRead: [userOwns, 'admins'],
    canUpdate: [userOwns, 'admins'],
  },
  nearestCity: {
    type: String,
    optional: true,
    nullable: true,
    hidden: true,
    canRead: [userOwns, 'admins'],
    canUpdate: [userOwns, 'admins'],
  },
  // Looks like: {"Boston": "I’m unwilling or unable to move here"}
  willingnessToRelocate: {
    type: Object,
    blackbox: true,
    optional: true,
    nullable: true,
    hidden: true,
    canRead: [userOwns, 'admins'],
    canUpdate: [userOwns, 'admins'],
  },
  experiencedIn: {
    type: Array,
    optional: true,
    nullable: true,
    hidden: true,
    canRead: [userOwns, 'admins'],
    canUpdate: [userOwns, 'admins'],
  },
  'experiencedIn.$': {
    type: String,
    optional: true
  },
  interestedIn: {
    type: Array,
    optional: true,
    nullable: true,
    hidden: true,
    canRead: [userOwns, 'admins'],
    canUpdate: [userOwns, 'admins'],
  },
  'interestedIn.$': {
    type: String,
    optional: true
  },
  lastUpdated: {
    type: Date,
    optional: true,
    nullable: false,
    canCreate: ['members'],
    canRead: [userOwns],
    canUpdate: [userOwns],
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
  },
};

export default schema;
