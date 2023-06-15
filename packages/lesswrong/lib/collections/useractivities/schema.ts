const schema: SchemaType<DbUserActivity> = {
  visitorId: {
    type: String
  },
  type: {
    type: String,
    allowedValues: ["userId", "clientId"],
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  activityArray: {
    type: Array
  },
  'activityArray.$': {
    // In practice this is currently a boolean, but we could support weighting by how long exactly they were active for
    type: Number,
    optional: false
  },
};

export default schema;
