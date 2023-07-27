
const schema: SchemaType<DbHybridViewLog> = {
  identifier: {
    type: String,
  },
  versionHash: {
    type: String,
  },
  action: {
    type: String,
    allowedValues: ['CREATE_VIEW', 'REFRESH_VIEW'],
  },
  actionStartTime: {
    type: Date,
  },
  actionEndTime: {
    type: Date,
    nullable: true,
    optional: true,
  },
  latest: {
    // This should be essentially "MAX(actionTime) by identifier". This is only included to speed up and simplify queries.
    // Note that in general this is not absolutely guaranteed to be correct, as it gets updated manually and there may be
    // a delay
    type: Boolean,
  },
  status: {
    type: String,
    allowedValues: ['IN_PROGRESS', 'SUCCESS', 'FAILURE'],
  }
};

export default schema;
