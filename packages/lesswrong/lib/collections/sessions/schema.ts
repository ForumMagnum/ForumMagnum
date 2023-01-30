const commonFields = (nullable: boolean) => ({
  hidden: true,
  insertableBy: ['admins' as const],
  viewableBy: ['admins' as const],
  editableBy: ['admins' as const],
  optional: nullable,
  nullable,
});

const schema: SchemaType<DbSession> = {
  // Sessions doesn't have universal fields so we need to add the _id manually
  _id: {
    type: String,
    ...commonFields(false),
  },
  expires: {
    type: Date,
    ...commonFields(false),
  },
  session: {
    type: Object,
    blackbox: true,
    ...commonFields(true),
  },
};

export default schema;
