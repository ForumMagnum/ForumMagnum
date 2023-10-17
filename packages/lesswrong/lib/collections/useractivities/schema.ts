const schema: SchemaType<DbUserActivity> = {
  visitorId: {
    type: String,
    nullable: true
  },
  type: {
    type: String,
    allowedValues: ["userId", "clientId"],
    nullable: true
  },
  startDate: {
    type: Date,
    nullable: true
  },
  endDate: {
    type: Date,
    nullable: true //TODO not-null, confirm that this should be nullable
  },
  activityArray: {
    type: Array,
    nullable: true
  },
  'activityArray.$': {
    // In practice this is currently a boolean, but we could support weighting by how long exactly they were active for
    type: Number,
    optional: false
  },
};

export default schema;
