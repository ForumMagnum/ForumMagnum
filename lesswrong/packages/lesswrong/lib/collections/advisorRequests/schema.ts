import { foreignKeyField, schemaDefaultValue } from '../../utils/schemaUtils'
import { userOwns } from '../../vulcan-users/permissions';
import SimpleSchema from 'simpl-schema';

export interface JobAdsType {
  state: 'seen'|'expanded'|'interested'|'uninterested'
  uninterestedReason?: string
  lastUpdated: Date
}
const jobAdsType = new SimpleSchema({
  state: {
    type: String,
    allowedValues: ['seen', 'expanded', 'interested', 'uninterested'],
  },
  uninterestedReason: {
    type: String,
    optional: true,
    nullable: true
  },
  lastUpdated: {
    type: Date,
    optional: true
  },
})

const schema: SchemaType<"AdvisorRequests"> = {
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      // TODO not-null: is this collection being used at all?
      nullable: true,
    }),
    nullable: false,
    hidden: true,
    canCreate: ['members', 'admins'],
    canRead: [userOwns, 'admins'],
    canUpdate: [userOwns, 'admins'],
  },
  interestedInMetaculus: {
    type: Boolean,
    optional: true,
    // TODO not-null: is this collection being used at all?
    hidden: true,
    canCreate: ['members', 'admins'],
    canRead: [userOwns, 'admins'],
    canUpdate: [userOwns, 'admins'],
    ...schemaDefaultValue(false),
  },
  jobAds: {
    type: Object,
    optional: true,
    nullable: true,
    // TODO not-null: is this collection being used at all?
    hidden: true,
    blackbox: true,
    canCreate: ['members', 'admins'],
    canRead: [userOwns, 'admins'],
    canUpdate: [userOwns, 'admins'],
  },
  'jobAds.$': {
    type: jobAdsType,
    canRead: ['members'],
  },
};

export default schema;
