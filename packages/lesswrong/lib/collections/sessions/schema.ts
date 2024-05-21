const commonFields = (nullable: boolean) => ({
  hidden: true,
  canCreate: ['admins' as const],
  canRead: ['admins' as const],
  canUpdate: ['admins' as const],
  optional: nullable,
  nullable,
});

const schema: SchemaType<"Sessions"> = {
  // Sessions doesn't have universal fields so we need to add the _id manually
  _id: {
    type: String,
    ...commonFields(false),
  },
  session: {
    type: Object,
    blackbox: true,
    ...commonFields(true),
  },
  expires: {
    type: Date,
    ...commonFields(true),
  },
  lastModified: {
    type: Date,
    ...commonFields(true),
  },
};

export default schema;
