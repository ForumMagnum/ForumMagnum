import { addUniversalFields } from '../../collectionUtils';

const schema: SchemaType<"UserActivities"> = {
  ...addUniversalFields({}),
  visitorId: {
    type: String,
    nullable: false
  },
  type: {
    type: String,
    allowedValues: ["userId", "clientId"],
    nullable: false
  },
  startDate: {
    type: Date,
    nullable: false
  },
  endDate: {
    type: Date,
    nullable: false
  },
  activityArray: {
    type: Array,
    nullable: false
  },
  'activityArray.$': {
    // In practice this is currently a boolean, but we could support weighting by how long exactly they were active for
    type: Number,
    optional: false
  },
};

export default schema;
