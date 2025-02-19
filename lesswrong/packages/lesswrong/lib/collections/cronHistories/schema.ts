const commonFields = (nullable: boolean) => ({
  hidden: true,
  canCreate: ['admins' as const],
  canRead: ['admins' as const],
  canUpdate: ['admins' as const],
  optional: nullable,
  nullable,
});

const schema: SchemaType<"CronHistories"> = {
  // CronHistory doesn't have universal fields so we need to add the _id manually
  _id: {
    type: String,
    ...commonFields(false),
  },
  intendedAt: {
    type: Date,
    ...commonFields(false),
  },
  name: {
    type: String,
    ...commonFields(false),
  },
  startedAt: {
    type: Date,
    ...commonFields(false),
  },
  finishedAt: {
    type: Date,
    ...commonFields(true),
  },
  result: {
    type: Object,
    blackbox: true,
    ...commonFields(true),
  },
};

export default schema;
