const schema: SchemaType<DbAdvisorRequest> = {
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
    type: Number, // in practice, this is currently a boolean
    optional: false
  },
};

export default schema;
